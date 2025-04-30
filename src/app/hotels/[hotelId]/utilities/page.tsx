import AddUtilityModal from "@/components/AddUtilityModal";

// Inside component
const [showModal, setShowModal] = useState(false);

// Add button above controls:
<button onClick={() => setShowModal(true)}>+ Add Utility Bill</button>

{showModal && (
  <AddUtilityModal
    hotelId={hotelId}
    onClose={() => setShowModal(false)}
    onSave={() => {
      setShowModal(false);
      // Optionally refetch dashboard data
    }}
  />
)}
