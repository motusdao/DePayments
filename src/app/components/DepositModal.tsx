import React, { useState, useEffect, useRef } from "react";
import { Transak, TransakConfig } from '@transak/transak-sdk';
import { useWallets } from "@privy-io/react-auth";

// Puedes reemplazar estos con tus propios selectores si ya existen
type SelectProps = {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
};
const Select: React.FC<SelectProps> = ({ value, onChange, options }) => (
  <select
    className="w-full border rounded-lg px-4 py-2 mb-4"
    value={value}
    onChange={e => onChange(e.target.value)}
  >
    <option value="">Selecciona destino</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// Simulación de función para obtener el wallet del PSM asignado (reemplaza con tu lógica real)
async function getAssignedPsychologistWallet(userId: string): Promise<string> {
  // Aquí deberías llamar a tu backend/Supabase
  return "0xPSMWalletExample";
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPsychologist: boolean;
  userId: string;
  userWallet?: string;
  psmWallet?: string;
  treasuryWallet?: string;
}

const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  isPsychologist,
  userId,
  userWallet: userWalletProp,
  psmWallet: psmWalletProp,
  treasuryWallet: treasuryWalletProp,
}) => {
  const{wallets} = useWallets();
  const address = wallets?.[0]?.address;
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [psmWallet, setPsmWallet] = useState(psmWalletProp || "");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const transakRef = useRef<Transak | null>(null);

  const treasuryWallet = treasuryWalletProp || process.env.NEXT_PUBLIC_TREASURY_ADDRESS || "";
  const userWallet = userWalletProp || "0xUserWalletExample"; // Reemplaza con lógica real

  // Obtener wallet del PSM asignado si es usuario
  useEffect(() => {
    if (!isPsychologist && userId && !psmWalletProp) {
      setLoading(true);
      getAssignedPsychologistWallet(userId)
        .then(addr => setPsmWallet(addr))
        .catch(() => setPsmWallet(""))
        .finally(() => setLoading(false));
    }
  }, [isPsychologist, userId, psmWalletProp]);

  // Cerrar modal al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Cleanup for Transak
  useEffect(() => {
    return () => {
      if (transakRef.current) {
        transakRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  // Opciones de destino según rol
  const options = isPsychologist
    ? [
        { value: userWallet, label: "Mi cuenta personal" },
        { value: treasuryWallet, label: "Tesorería MotusDAO" },
      ]
    : [
        { value: userWallet, label: "Mi cuenta personal" },
        ...(psmWallet ? [{ value: psmWallet, label: "Mi psicólogo asignado" }] : []),
        { value: treasuryWallet, label: "Tesorería MotusDAO" },
      ];

  const handleContinue = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    const apiKey = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || '';
    const isStaging = apiKey === 'f6d14140-5912-4ea6-9579-b88593ac91c9';
    console.log("detination",wallets)
    const config: TransakConfig = {
      apiKey,
      environment: isStaging ? Transak.ENVIRONMENTS.STAGING : Transak.ENVIRONMENTS.PRODUCTION,
      walletAddress: address,
    };

    const transak = new Transak(config);
    transakRef.current = transak;

    transak.init();

    // To get all the events
    Transak.on('*', (data) => {
      console.log(data);
    });

    // This will trigger when the user closed the widget
    Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
      onClose();
    });

    /*
    * This will trigger when the user has confirmed the order
    * This doesn't guarantee that payment has completed in all scenarios
    * If you want to close/navigate away, use the TRANSAK_ORDER_SUCCESSFUL event
    */
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (orderData) => {
      console.log(orderData);
    });

    /*
    * This will trigger when the user marks payment is made
    * You can close/navigate away at this event
    */
    Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
      console.log(orderData);
      if (transakRef.current) {
        transakRef.current.close();
      }
      onClose();
    });

    setShowConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">×</button>
        <h2 className="text-2xl font-bold mb-6 text-center">Depositar Fondos</h2>
        <label className="block mb-2 font-medium">Destino del depósito</label>
        <Select value={destination} onChange={setDestination} options={options} />
        {!isPsychologist && !psmWallet && !loading && (
          <div className="text-red-500 text-sm mb-2">No tienes un psicólogo asignado.</div>
        )}
        <label className="block mb-2 font-medium">Monto a depositar (MXN)</label>
        <input
          type="number"
          min="1"
          className="w-full border rounded-lg px-4 py-2 mb-4"
          placeholder="300"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <button
          className="mt-2 w-full bg-[#635BFF] text-white rounded-full py-3 font-bold disabled:opacity-60 hover:bg-[#b266ff] cursor-pointer"
          disabled={!destination || !amount || Number(amount) <= 0 || loading}
          onClick={handleContinue}
        >
          Continuar
        </button>
        {/* Modal de confirmación */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-center">Confirmar depósito</h3>
              <p className="mb-4 text-center">
                Vas a depositar <span className="font-bold">${amount} MXN</span> a <br />
                <span className="font-mono break-all">{destination}</span>
              </p>
              <div className="flex gap-4">
                <button
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancelar
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-[#635BFF] hover:bg-[#b266ff] text-white rounded-full font-bold transition-colors cursor-pointer"
                  onClick={handleConfirm}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;