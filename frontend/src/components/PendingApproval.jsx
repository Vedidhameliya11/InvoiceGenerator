import "./PendingApproval.css";

export default function PendingApproval() {
  return (
    <div className="pending-wrapper">
      <div className="pending-box">
        <div className="pending-icon">⏳</div>
        <h2>Registration Submitted</h2>
        <p>
          Thanks for registering your shop! Your details have been received
          and are currently under review.
        </p>
        <p className="pending-highlight">
          Please wait for your approval. You'll be notified once an admin
          approves your account.
        </p>
      </div>
    </div>
  );
}