import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import { useAuth } from '../../contexts/AuthContext';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import PropertyCard from './components/PropertyCard';
import PropertyFilters from './components/PropertyFilters';
import AddPropertyModal from './components/AddPropertyModal';
import PropertyDetailsModal from './components/PropertyDetailsModal';

const Properties = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editingProperty, setEditingProperty] = useState(null);

  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const [statistics, setStatistics] = useState({
    total: 0,
    published: 0,
    available: 0,
    occupied: 0
  });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 2500);
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    
    // Wait for authentication to complete before loading properties
    if (!authLoading && user) {
      loadProperties();
    }
  }, [authLoading, user]);

  const loadProperties = async () => {
    try {
      setLoading(true);

      const [propertiesData, statsData] = await Promise.all([
        propertyService?.getAll(),
        propertyService?.getStatistics()
      ]);

      setProperties(propertiesData);
      setFilteredProperties(applyFiltersInternal(propertiesData, filters));
      setStatistics(statsData);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersInternal = (list, filters) => {
    let filtered = [...list];

    if (filters?.search) {
      const t = filters?.search?.toLowerCase();
      filtered = filtered?.filter(
        (p) =>
          p?.name?.toLowerCase()?.includes(t) ||
          p?.propertyCode?.toLowerCase()?.includes(t) ||
          p?.location?.toLowerCase()?.includes(t)
      );
    }

    if (filters?.type) {
      filtered = filtered?.filter(
        (p) => p?.type?.toLowerCase() === filters?.type?.toLowerCase()
      );
    }

    if (filters?.location) {
      filtered = filtered?.filter(
        (p) => p?.location?.toLowerCase() === filters?.location?.toLowerCase()
      );
    }

    if (filters?.status) {
      filtered = filtered?.filter((p) => p?.status === filters?.status);
    }

    return filtered;
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setFilteredProperties(applyFiltersInternal(properties, newFilters));
  };

  const handleViewDetails = (property) => {
    setSelectedProperty(property);
    setShowDetailsModal(true);
  };

  const handleCreateProperty = async (data) => {
    try {
      await propertyService?.create(data);
      await loadProperties();
      setShowAddModal(false);
      showSuccess('Property created successfully');
    } catch (err) {
      console.error(err);
      showError('Failed to add property');
    }
  };

const handleOpenEdit = async (property) => {
  const fullProperty = await propertyService?.getByIdWithDetails(property?.id);
  setEditingProperty(fullProperty);
  setShowAddModal(true);
};

  const handleUpdateProperty = async (data) => {
    try {
      await propertyService?.update(data?.id, data);
      await loadProperties();
      setEditingProperty(null);
      setShowAddModal(false);
      showSuccess('Property updated successfully');
    } catch (err) {
      console.error(err);
      showError('Failed to update property');
    }
  };

  const getTranslation = (key) => {
    const t = {
      en: {
        title: 'Properties',
        subtitle: 'Manage your property portfolio',
        addProperty: 'Add Property'
      },
      fr: {
        title: 'Propriétés',
        subtitle: 'Gérez votre portefeuille immobilier',
        addProperty: 'Ajouter une propriété'
      }
    };
    return t?.[currentLanguage]?.[key] || t?.en?.[key];
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <Icon name="CheckCircle" size={18} />
          {successMessage}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">{getTranslation('title')}</h1>
          <p className="text-muted-foreground">{getTranslation('subtitle')}</p>
        </div>

        <Button
          iconName="Plus"
          onClick={() => {
            setEditingProperty(null);
            setShowAddModal(true);
          }}
        >
          {getTranslation('addProperty')}
        </Button>
      </div>
      <PropertyFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={properties?.length}
        filteredCount={filteredProperties?.length}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProperties?.map((property) => (
          <PropertyCard
            key={property?.id}
            property={property}
            onViewDetails={handleViewDetails}

            onToggleActivation={async (id, status) => {
  try {
    if (status === 'disabled') {
      await propertyService?.enable(id);
      showSuccess('Propriété activée');
    } else {
      await propertyService?.disable(id);
      showSuccess('Propriété désactivée');
    }
    await loadProperties();
  } catch (e) {
    console.error(e);
    showError("Impossible de changer l'état de la propriété.");
  }
}}

            onArchive={async (id, status) => {
              try {
                if (status === 'archived') {
                  await propertyService?.restore(id);
                  showSuccess('Propriété désarchivée');
                } else {
                  await propertyService?.archive(id);
                  showSuccess('Propriété archivée');
                }
                await loadProperties();
              } catch (e) {
                console.error(e);
                if (e?.message === 'ARCHIVE_FORBIDDEN_ACTIVE_RESERVATION') {
                  showError("Impossible d'archiver : des réservations sont actives.");
                } else {
                  showError("Action impossible sur la propriété.");
                }
              }
            }}

            /* ✅ MAJ : OWNER VIEW */
            onOwnerView={(property) => {
              navigate(`/properties/${property?.id}/owner`);
            }}

            onPublicView={(property) => {
              navigate(`/properties/${property?.id}/public`);
            }}

            onShareWhatsApp={(property) => {
              const url = `${window.location.origin}/properties/${property?.id}/public`;
              const message = `Check out this property: ${property?.name} - ${url}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
            }}

            onReservation={(property) => {
              navigate(`/reservations/new?propertyId=${property?.id}`);
            }}

            onEdit={() => handleOpenEdit(property)}
          />
        ))}
      </div>
      <AddPropertyModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingProperty(null);
        }}
        onAddProperty={editingProperty ? handleUpdateProperty : handleCreateProperty}
        editProperty={editingProperty}
      />
      <PropertyDetailsModal
        isOpen={showDetailsModal}
        property={selectedProperty}
        onClose={() => {
          setSelectedProperty(null);
          setShowDetailsModal(false);
        }}
        onEdit={() => handleOpenEdit(selectedProperty)}
      />
    </div>
  );
};

export default Properties;