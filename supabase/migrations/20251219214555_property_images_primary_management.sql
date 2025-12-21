-- =====================================================
-- PROPERTY IMAGES PRIMARY & ORDERING MANAGEMENT
-- =====================================================
-- PURPOSE: Implement explicit primary image selection,
--          drag & drop ordering, and intelligent deletion
--          with automatic primary recalculation
-- =====================================================

-- =====================================================
-- FUNCTION: Set Primary Image (Explicit User Action)
-- =====================================================
-- PREVENTS automatic primary changes during upload
-- ENSURES only ONE primary image per property
-- SYNCS properties.image_url with primary image
-- =====================================================

CREATE OR REPLACE FUNCTION set_primary_property_image(
  p_image_id UUID,
  p_property_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_image_url TEXT;
BEGIN
  -- 1. Verify image exists and belongs to property
  SELECT image_url INTO v_image_url
  FROM property_images
  WHERE id = p_image_id AND property_id = p_property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Image not found or does not belong to this property';
  END IF;

  -- 2. Set all images of this property to NOT primary
  UPDATE property_images
  SET is_primary = false
  WHERE property_id = p_property_id;

  -- 3. Set selected image as primary
  UPDATE property_images
  SET is_primary = true
  WHERE id = p_image_id;

  -- 4. Sync properties.image_url with primary image
  UPDATE properties
  SET image_url = v_image_url
  WHERE id = p_property_id;

END;
$$;

-- =====================================================
-- FUNCTION: Reorder Images (Drag & Drop)
-- =====================================================
-- UPDATES display_order ONLY
-- DOES NOT modify is_primary flag
-- DETERMINISTIC ordering based on display_order
-- =====================================================

CREATE OR REPLACE FUNCTION reorder_property_images(
  p_image_orders JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_image JSONB;
BEGIN
  -- Validate input
  IF p_image_orders IS NULL OR jsonb_array_length(p_image_orders) = 0 THEN
    RAISE EXCEPTION 'Image orders array cannot be empty';
  END IF;

  -- Update display_order for each image
  FOR v_image IN SELECT * FROM jsonb_array_elements(p_image_orders)
  LOOP
    UPDATE property_images
    SET display_order = (v_image->>'display_order')::INTEGER
    WHERE id = (v_image->>'id')::UUID;
  END LOOP;

END;
$$;

-- =====================================================
-- FUNCTION: Handle Image Deletion with Primary Recalculation
-- =====================================================
-- AUTOMATICALLY recalculates primary if deleted
-- SYNCS properties.image_url after deletion
-- USES display_order to determine new primary
-- =====================================================

CREATE OR REPLACE FUNCTION handle_property_image_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_was_primary BOOLEAN;
  v_property_id UUID;
  v_new_primary_url TEXT;
BEGIN
  -- Store deleted image info
  v_was_primary := OLD.is_primary;
  v_property_id := OLD.property_id;

  -- If deleted image was primary, recalculate primary
  IF v_was_primary THEN
    -- Get first remaining image by display_order
    SELECT image_url INTO v_new_primary_url
    FROM property_images
    WHERE property_id = v_property_id
    ORDER BY display_order ASC
    LIMIT 1;

    -- If images remain, set new primary
    IF v_new_primary_url IS NOT NULL THEN
      -- Set first image as primary
      UPDATE property_images
      SET is_primary = true
      WHERE property_id = v_property_id
        AND image_url = v_new_primary_url;

      -- Sync properties.image_url
      UPDATE properties
      SET image_url = v_new_primary_url
      WHERE id = v_property_id;
    ELSE
      -- No images left, clear properties.image_url
      UPDATE properties
      SET image_url = NULL
      WHERE id = v_property_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$;

-- =====================================================
-- TRIGGER: Auto-handle image deletion
-- =====================================================

DROP TRIGGER IF EXISTS trigger_handle_property_image_deletion ON property_images;

CREATE TRIGGER trigger_handle_property_image_deletion
  BEFORE DELETE ON property_images
  FOR EACH ROW
  EXECUTE FUNCTION handle_property_image_deletion();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION set_primary_property_image(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_property_images(JSONB) TO authenticated;