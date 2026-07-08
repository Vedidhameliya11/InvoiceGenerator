import "./PendingApproval.css";

export default function PendingApproval({ onBackToLogin }) {
  return (
    <div className="pending-wrapper">
      <div className="pending-box">
        <div className="pending-icon">⏳</div>
        <h2>Registration Submitted</h2>
        <p>
          Thanks for registering your shop! We've sent a confirmation email,
          and your details are currently under review.
        </p>
        <p className="pending-highlight">
          Please wait for your approval email. You'll receive your login
          password once an admin approves your account.
        </p>
        <button
          type="button"
          className="pending-login-btn"
          onClick={onBackToLogin}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}