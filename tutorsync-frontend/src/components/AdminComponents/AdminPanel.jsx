import React, { useState } from "react";
import HourManagement from "../AdminComponents/HourManagement";
import BookingsManagement from "../AdminComponents/BookingsManagement";

function AdminPanel() {
    const [activeTab, setActiveTab] = useState("hours");

    return (
        <div className="container-fluid m-0 m-lg-5 mb-0">
            <div className="row mb-4">
                <div className="col">
                    <h3 className="text-primary">Admin Panel</h3>
                    <p className="text-muted">
                        Manage available hours and check assigned tutoring
                        sessions.
                    </p>
                </div>
            </div>

            <div className="row mb-3">
                <div className="col">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${
                                    activeTab === "hours" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("hours")}
                            >
                                Hours Settings
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${
                                    activeTab === "bookings" ? "active" : ""
                                }`}
                                onClick={() => setActiveTab("bookings")}
                            >
                                Assigned Tutoring Sessions
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    {activeTab === "hours" ? (
                        <HourManagement />
                    ) : (
                        <BookingsManagement />
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminPanel;
