import { useSelf } from '../providers/SelfProvider';

export function VerifyButton() {
  const { startVerification, isVerified, verificationError } = useSelf();

  return (
    <div>
      {isVerified ? (
        <p>Verified!</p>
      ) : (
        <button onClick={startVerification}>Verify Identity</button>
      )}
      {verificationError && <p>Error: {verificationError}</p>}
    </div>
  );
}