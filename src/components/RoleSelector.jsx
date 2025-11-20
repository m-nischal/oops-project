// components/RoleSelector.jsx
import React from "react";

export default function RoleSelector({ value, onChange }) {
  return (
    <div className="role-selector">
      <label>
        <input type="radio" name="role" value="CUSTOMER" checked={value==="CUSTOMER"} onChange={e => onChange(e.target.value)} />
        Customer
      </label>
      <label>
        <input type="radio" name="role" value="RETAILER" checked={value==="RETAILER"} onChange={e => onChange(e.target.value)} />
        Retailer
      </label>
      <label>
        <input type="radio" name="role" value="WHOLESALER" checked={value==="WHOLESALER"} onChange={e => onChange(e.target.value)} />
        Wholesaler
      </label>
    </div>
  );
}
