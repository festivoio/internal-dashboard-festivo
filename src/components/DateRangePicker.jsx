function DateRangePicker({ startDate, endDate, noEndDate, onChange }) {
  return (
    <section className="fee-form-card">
      <div className="fee-section-header">
        <h3>Section 3: Schedule</h3>
      </div>

      <label className="fee-inline-label" htmlFor="active-from">Active Period</label>
      <div className="date-range-row">
        <input
          id="active-from"
          type="date"
          value={startDate}
          onChange={(event) => onChange({ field: 'startDate', value: event.target.value })}
        />
        <span>—</span>
        <input
          type="date"
          value={endDate}
          disabled={noEndDate}
          onChange={(event) => onChange({ field: 'endDate', value: event.target.value })}
        />
      </div>

      <label className="fee-inline-check">
        <input
          type="checkbox"
          checked={noEndDate}
          onChange={(event) => onChange({ field: 'noEndDate', value: event.target.checked })}
        />
        No end date
      </label>
    </section>
  )
}

export default DateRangePicker
