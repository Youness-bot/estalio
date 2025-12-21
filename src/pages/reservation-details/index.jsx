import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from '../../lib/supabase';

import ClientInfoCard from './components/ClientInfoCard';
import StayDetailsCard from './components/StayDetailsCard';
import MessagingPanel from './components/MessagingPanel';
import PaymentDetailsCard from './components/PaymentDetailsCard';
import LinkedTasksPanel from './components/LinkedTasksPanel';
import NotesSection from './components/NotesSection';
import QuickActionsPanel from './components/QuickActionsPanel';

const ReservationDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);

  // ---------------------------------------------------------
  // FETCH RESERVATION WITH FINANCIAL FIELDS
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchReservation = async () => {
      if (!id || id === "undefined" || id === "null") {
        setError("Invalid reservation ID");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error: fetchError } = await supabase
          .from("reservations")
          .select(`
            *,
            booking_payment_type,
            properties (
              name,
              property_code,
              property_type,
              image_url
            )
          `)
          .eq("id", id)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        if (!data) {
          setError("Reservation not found");
          setLoading(false);
          return;
        }

        // ---------------------------------------------------------
        // MAP DB → STRUCTURE USED BY ALL COMPONENTS
        // ---------------------------------------------------------
        const mapped = {
          id: data?.id,
          reservation_code: data?.reservation_code,
          status: data?.status,
          booking_channel: data?.booking_channel,
          booking_payment_type: data?.booking_payment_type || null,
          created_at: data?.created_at,

          client: {
            name: data?.guest_name,
            email: data?.guest_email,
            phone: data?.guest_phone,
            nationality: data?.nationality || "N/A",
            language: "English",
            avatar:
              "https://img.rocket.new/generatedImages/rocket_gen_img_11b715d60-1762273834012.png",
          },

          property: {
            name: data?.properties?.name,
            code: data?.properties?.property_code,
            type: data?.properties?.property_type,
            image:
              data?.properties?.image_url ||
              "https://images.unsplash.com/photo-1600414706122-9b1f42418677",
          },

          dates: {
            checkIn: data?.check_in_date,
            checkOut: data?.check_out_date,
            checkInTime: data?.check_in_time || "3:00 PM",
            checkOutTime: data?.check_out_time || "11:00 AM",
          },

          guests: {
            adults: data?.adults,
            children: data?.children,
            total: data?.total_guests,
          },

          // FINANCIAL FIELDS
          gross_amount: Number(data?.gross_amount || 0),
          city_tax_amount: Number(data?.city_tax_amount || 0),
          taxable_base_amount: Number(data?.taxable_base_amount || 0),
          channel_commission_amount: Number(data?.channel_commission_amount || 0),
          bank_fee_amount: Number(data?.bank_fee_amount || 0),
          net_amount: Number(data?.net_amount || 0),

          payment_method: data?.payment_method || "N/A",
          payment_status: data?.payment_status || "unpaid",
          paid_at: data?.paid_at,
          currency: data?.currency || "MAD",

          financial_breakdown: data?.financial_breakdown || null,
        };

        setReservation(mapped);
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id]);

  // ---------------------------------------------------------
  // AUTO-SCROLL TO MESSAGES
  // ---------------------------------------------------------
  useEffect(() => {
    if (location?.search?.includes("scroll=messages")) {
      setTimeout(() => {
        document
          .getElementById("messagesSection")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [location]);

  // ---------------------------------------------------------
  // LOADING SCREEN
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading reservation details...
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR SCREEN
  // ---------------------------------------------------------
  if (error || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">{error}</h2>
          <button
            onClick={() => navigate("/reservations")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Back to Reservations
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PAGE CONTENT
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reservation Details</h1>
        <p className="text-muted-foreground">
          {reservation?.reservation_code} • {reservation?.client?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClientInfoCard reservation={reservation} />
            <StayDetailsCard reservation={reservation} />
          </div>

          {/* ⭐ Payment panel now has booking_payment_type */}
          <PaymentDetailsCard 
  reservation={reservation} 
  onPaymentUpdated={(updated) => setReservation(updated)} 
/>
          <div id="messagesSection">
            <MessagingPanel
              messages={messages}
              onSendMessage={(msg) => setMessages([...messages, msg])}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LinkedTasksPanel tasks={tasks} />
            <NotesSection notes={notes} />
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-20">
            <QuickActionsPanel reservation={reservation} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetails;
