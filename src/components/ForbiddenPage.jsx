function ForbiddenPage({ onRetry }) {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Forbidden</h1>
            <p>Your account is authenticated but does not have admin access.</p>
          </div>

          <div className="login-actions">
            <button
              type="button"
              className="login-btn"
              onClick={onRetry}
            >
              Retry Access Check
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage
