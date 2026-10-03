import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

const objects = [
  "Account",
  "Contact",
  "Lead",
  "Opportunity",
  "Case",
];

type RecordData = {
  Id?: string;
  [key: string]: any;
};

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

function App() {
  const [selectedObject, setSelectedObject] = useState("Account");
  const [records, setRecords] = useState<RecordData[]>([]);
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);

  const [formData, setFormData] = useState<RecordData>({});
  const [viewRecord, setViewRecord] = useState<RecordData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  /*
   * Check Salesforce connection when the application starts.
   *
   * IMPORTANT:
   * Not being connected is NOT considered an error.
   * The user is simply shown the Salesforce login screen.
   */
  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connected) {
      loadData();
      loadMetadata();
    }
  }, [selectedObject, page, connected]);

  function showToast(
    message: string,
    type: ToastType = "success"
  ) {
    const id = Date.now();

    setToasts((previous) => [
      ...previous,
      {
        id,
        message,
        type,
      },
    ]);

    window.setTimeout(() => {
      setToasts((previous) =>
        previous.filter((toast) => toast.id !== id)
      );
    }, 3500);
  }

  async function checkConnection() {
    try {
      const response = await fetch(`${API}/salesforce/status`);
      const data = await response.json();

      setConnected(Boolean(data.connected));

      /*
       * IMPORTANT:
       * Do NOT display "Please connect your Salesforce account"
       * on the login page.
       */
      setError("");
    } catch {
      /*
       * Even if the status request fails, don't show the old
       * Salesforce connection warning on the login screen.
       */
      setConnected(false);
      setError("");
    }
  }

  function connectSalesforce() {
    window.location.href = `${API}/auth/login`;
  }

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/salesforce/records/${selectedObject}?page=${page}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load records"
        );
      }

      setRecords(data.records || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      const message =
        err.message || "Failed to load records";

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMetadata() {
    try {
      const response = await fetch(
        `${API}/salesforce/metadata/${selectedObject}`
      );

      const data = await response.json();

      if (response.ok) {
        setFields(data.fields || []);
      }
    } catch {
      console.log("Metadata could not be loaded");
    }
  }

  async function refreshData() {
    await loadData();
    await loadMetadata();

    showToast(
      `${selectedObject} data refreshed`,
      "success"
    );
  }

  function startCreate() {
    setEditingId(null);
    setFormData({});
    setShowCreate(true);
  }

  function startEdit(record: RecordData) {
    setEditingId(record.Id || null);

    const editableData: RecordData = {};

    fields.forEach((field) => {
      if (
        field.updateable &&
        record[field.name] !== undefined &&
        field.name !== "Id"
      ) {
        editableData[field.name] = record[field.name];
      }
    });

    setFormData(editableData);
    setShowCreate(true);
  }

  function startView(record: RecordData) {
    setViewRecord(record);
    setShowView(true);
  }

  function handleInputChange(
    name: string,
    value: string
  ) {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveRecord() {
    try {
      setLoading(true);

      const url = editingId
        ? `${API}/salesforce/records/${selectedObject}/${editingId}`
        : `${API}/salesforce/records/${selectedObject}`;

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Operation failed"
        );
      }

      showToast(
        editingId
          ? `${selectedObject} updated successfully`
          : `${selectedObject} created successfully`,
        "success"
      );

      setShowCreate(false);
      setFormData({});
      setEditingId(null);

      await loadData();
    } catch (err: any) {
      showToast(
        err.message || "Operation failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteRecord(id: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${selectedObject}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/salesforce/records/${selectedObject}/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Delete failed"
        );
      }

      showToast(
        `${selectedObject} deleted successfully`,
        "success"
      );

      await loadData();
    } catch (err: any) {
      showToast(
        err.message || "Delete failed",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function getDisplayFields() {
    if (selectedObject === "Account") {
      return [
        "Name",
        "Industry",
        "Phone",
        "Website",
      ];
    }

    if (selectedObject === "Contact") {
      return [
        "FirstName",
        "LastName",
        "Email",
        "Phone",
        "AccountId",
      ];
    }

    if (selectedObject === "Lead") {
      return [
        "FirstName",
        "LastName",
        "Company",
        "Email",
        "Phone",
        "Status",
      ];
    }

    if (selectedObject === "Opportunity") {
      return [
        "Name",
        "Amount",
        "StageName",
        "CloseDate",
        "AccountId",
      ];
    }

    if (selectedObject === "Case") {
      return [
        "CaseNumber",
        "Subject",
        "Status",
        "Priority",
        "AccountId",
      ];
    }

    return [];
  }

  function displayValue(
    record: RecordData,
    field: string
  ) {
    if (
      record[field] === null ||
      record[field] === undefined
    ) {
      return "-";
    }

    return String(record[field]);
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return records;
    }

    return records.filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [records, search]);

  const totalRecords =
    pagination?.total_records ?? records.length;

  const currentPage =
    pagination?.current_page ?? page;

  const totalPages =
    pagination?.total_pages ?? 1;

  const objectIcons: Record<string, string> = {
    Account: "◉",
    Contact: "♙",
    Lead: "✦",
    Opportunity: "↗",
    Case: "▣",
  };

  const objectDescriptions: Record<string, string> = {
    Account: "Companies and organizations",
    Contact: "People and customers",
    Lead: "Potential customers",
    Opportunity: "Sales opportunities",
    Case: "Customer support cases",
  };

  /*
   * ============================================================
   * LOGIN SCREEN
   * ============================================================
   */

  if (!connected) {
    return (
      <div className="app login-app">
        <div className="login-background">
          <div className="background-orb orb-one" />
          <div className="background-orb orb-two" />
          <div className="background-grid" />
        </div>

        <div className="login-wrapper">

          {/* BRAND */}
          <div className="login-brand">
            <div className="brand-mark large">
              ☁
            </div>

            <div>
              <div className="brand-name">
                CloudCRM
              </div>

              <div className="brand-subtitle">
                Salesforce CRM Management Platform
              </div>
            </div>
          </div>

          {/* LOGIN CARD */}
          <div className="login-card">

            <div className="login-icon">
              <span>☁</span>
            </div>

            <div className="login-heading">
              <span className="eyebrow">
                WELCOME TO CLOUDCRM
              </span>

              <h1>
                Connect your Salesforce
              </h1>

              <p>
                Sign in with Salesforce to manage
                your CRM records through one
                powerful workspace.
              </p>
            </div>

            {/* NO CONNECTION ERROR HERE */}

            <button
              className="salesforce-login-button"
              onClick={connectSalesforce}
            >
              <span className="salesforce-cloud">
                ☁
              </span>

              <span>
                Login with Salesforce
              </span>

              <span className="login-arrow">
                →
              </span>
            </button>

            <div className="login-features">
              <div>
                <span>✓</span>
                Secure Salesforce OAuth
              </div>

              <div>
                <span>✓</span>
                Real-time CRM data
              </div>

              <div>
                <span>✓</span>
                Full record management
              </div>
            </div>

            <div className="login-footer">
              <span className="status-dot" />
              Salesforce integration ready
            </div>
          </div>

          <div className="login-developer">
            Developed by{" "}
            <strong>
              Chethan Dasaraiahgari
            </strong>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN CRM DASHBOARD
   * ============================================================
   */

  return (
    <div className="app">

      {/* MOBILE SIDEBAR OVERLAY */}
      <div
        className={`mobile-sidebar-overlay ${
          sidebarOpen ? "show" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        }`}
      >

        <div className="sidebar-brand">

          <div className="brand-mark">
            ☁
          </div>

          <div className="brand-text">
            <div className="brand-name">
              CloudCRM
            </div>

            <div className="brand-mini">
              SALESFORCE
            </div>
          </div>

        </div>

        <div className="sidebar-section-title">
          WORKSPACE
        </div>

        <button
          className="sidebar-dashboard active"
          onClick={() => {
            setSidebarOpen(false);
            setSearch("");
          }}
        >
          <span className="sidebar-icon">
            ⌂
          </span>

          <span>
            Dashboard
          </span>
        </button>

        <div className="sidebar-section-title records-title">
          CRM OBJECTS
        </div>

        <div className="sidebar-objects">

          {objects.map((object) => (
            <button
              key={object}
              className={`sidebar-object ${
                selectedObject === object
                  ? "selected"
                  : ""
              }`}
              onClick={() => {
                setSelectedObject(object);
                setPage(1);
                setSearch("");
                setShowCreate(false);
                setSidebarOpen(false);
              }}
            >

              <span className="object-small-icon">
                {objectIcons[object]}
              </span>

              <span className="sidebar-object-content">
                <strong>
                  {object}
                </strong>

                <small>
                  {objectDescriptions[object]}
                </small>
              </span>

              {selectedObject === object && (
                <span className="selected-indicator" />
              )}

            </button>
          ))}

        </div>

        <div className="sidebar-bottom">

          <div className="connection-status">

            <span className="status-dot" />

            <div>
              <strong>
                Salesforce Connected
              </strong>

              <small>
                Live connection
              </small>
            </div>

          </div>

          <div className="developer-mini">

            <div className="developer-avatar">
              C
            </div>

            <div>
              <strong>
                Chethan
              </strong>

              <small>
                Administrator
              </small>
            </div>

          </div>

        </div>
      </aside>

      {/* ======================================================
          MAIN AREA
          ====================================================== */}

      <div className="main-area">

        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen(true)
              }
            >
              ☰
            </button>

            <div>

              <div className="breadcrumb">
                Workspace{" "}
                <span>/</span>{" "}
                {selectedObject}
              </div>

              <h1>
                CRM Dashboard
              </h1>

            </div>

          </div>

          <div className="topbar-right">

            <div className="live-status">
              <span className="status-dot" />
              <span>
                Connected
              </span>
            </div>

            <button
              className="top-refresh"
              onClick={refreshData}
              disabled={loading}
              title="Refresh data"
            >
              ↻
            </button>

            <div className="profile">

              <div className="profile-avatar">
                C
              </div>

              <div className="profile-info">

                <strong>
                  Chethan
                </strong>

                <span>
                  Salesforce Admin
                </span>

              </div>

            </div>

          </div>
        </header>

        {/* DASHBOARD */}

        <main className="dashboard-content">

          {/* WELCOME */}

          <section className="welcome-section">

            <div>

              <span className="eyebrow">
                CLOUDCRM WORKSPACE
              </span>

              <h2>
                Good to see you, Chethan 👋
              </h2>

              <p>
                Manage your Salesforce data from
                one clean and powerful workspace.
              </p>

            </div>

            <button
              className="primary-button hero-create"
              onClick={startCreate}
            >
              <span>＋</span>
              Create {selectedObject}
            </button>

          </section>

          {/* STATS */}

          <section className="stats-grid">

            {objects.map((object) => (
              <button
                className={`stat-card ${
                  selectedObject === object
                    ? "stat-selected"
                    : ""
                }`}
                key={object}
                onClick={() => {
                  setSelectedObject(object);
                  setPage(1);
                  setSearch("");
                }}
              >

                <div className="stat-card-top">

                  <div
                    className={`stat-icon icon-${object.toLowerCase()}`}
                  >
                    {objectIcons[object]}
                  </div>

                  {selectedObject === object && (
                    <span className="selected-pill">
                      ACTIVE
                    </span>
                  )}

                </div>

                <div className="stat-number">
                  {selectedObject === object
                    ? totalRecords
                    : "—"}
                </div>

                <div className="stat-label">
                  {object} Records
                </div>

                <div className="stat-description">
                  {objectDescriptions[object]}
                </div>

              </button>
            ))}

          </section>

          {/* WORKSPACE */}

          <section className="workspace-card">

            <div className="workspace-header">

              <div className="workspace-title">

                <div className="workspace-object-icon">
                  {objectIcons[selectedObject]}
                </div>

                <div>

                  <div className="workspace-kicker">
                    SALESFORCE OBJECT
                  </div>

                  <h2>
                    {selectedObject} Records
                  </h2>

                  <p>
                    {totalRecords} records available
                    in your Salesforce workspace
                  </p>

                </div>

              </div>

              <div className="workspace-actions">

                <button
                  className="secondary-button refresh-button"
                  onClick={refreshData}
                  disabled={loading}
                >
                  <span
                    className={
                      loading
                        ? "spinning"
                        : ""
                    }
                  >
                    ↻
                  </span>

                  Refresh
                </button>

                <button
                  className="primary-button"
                  onClick={startCreate}
                  disabled={loading}
                >
                  ＋ Add Record
                </button>

              </div>

            </div>

            {/* SEARCH */}

            <div className="toolbar">

              <div className="search-box">

                <span className="search-icon">
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder={`Search ${selectedObject.toLowerCase()} records...`}
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

                {search && (
                  <button
                    className="clear-search"
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    ×
                  </button>
                )}

              </div>

              <div className="toolbar-info">

                {search ? (
                  <span>
                    Showing{" "}
                    <strong>
                      {filteredRecords.length}
                    </strong>{" "}
                    matching records
                  </span>
                ) : (
                  <span>
                    Page{" "}
                    <strong>
                      {currentPage}
                    </strong>{" "}
                    of{" "}
                    <strong>
                      {totalPages}
                    </strong>
                  </span>
                )}

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="error-banner">

                <div className="error-symbol">
                  !
                </div>

                <div>
                  <strong>
                    Something went wrong
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>

                <button
                  onClick={loadData}
                >
                  Try again
                </button>

              </div>
            )}

            {/* TABLE */}

            <div className="table-wrapper">

              {loading &&
              records.length === 0 ? (
                <div className="loading-state">

                  <div className="loading-spinner" />

                  <h3>
                    Loading {selectedObject} records
                  </h3>

                  <p>
                    Connecting to Salesforce...
                  </p>

                </div>
              ) : filteredRecords.length ===
                0 ? (
                <div className="empty-state">

                  <div className="empty-icon">
                    ⌕
                  </div>

                  <h3>
                    {search
                      ? "No matching records"
                      : "No records found"}
                  </h3>

                  <p>
                    {search
                      ? "Try changing your search phrase."
                      : `There are currently no ${selectedObject.toLowerCase()} records to display.`}
                  </p>

                  {search ? (
                    <button
                      className="secondary-button"
                      onClick={() =>
                        setSearch("")
                      }
                    >
                      Clear Search
                    </button>
                  ) : (
                    <button
                      className="primary-button"
                      onClick={startCreate}
                    >
                      ＋ Create First Record
                    </button>
                  )}

                </div>
              ) : (
                <table className="crm-table">

                  <thead>

                    <tr>

                      <th className="id-column">
                        RECORD ID
                      </th>

                      {getDisplayFields().map(
                        (field) => (
                          <th key={field}>
                            {field
                              .replace(
                                /([A-Z])/g,
                                " $1"
                              )
                              .toUpperCase()}
                          </th>
                        )
                      )}

                      <th className="action-column">
                        ACTIONS
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredRecords.map(
                      (record) => (
                        <tr key={record.Id}>

                          <td className="record-id">

                            <span className="record-dot" />

                            <span>
                              {record.Id || "-"}
                            </span>

                          </td>

                          {getDisplayFields().map(
                            (field) => (
                              <td key={field}>
                                <div className="table-value">
                                  {displayValue(
                                    record,
                                    field
                                  )}
                                </div>
                              </td>
                            )
                          )}

                          <td className="table-actions">

                            <button
                              className="icon-action view-action"
                              onClick={() =>
                                startView(record)
                              }
                              title="View record"
                            >
                              ◉
                            </button>

                            <button
                              className="icon-action edit-action"
                              onClick={() =>
                                startEdit(record)
                              }
                              title="Edit record"
                            >
                              ✎
                            </button>

                            <button
                              className="icon-action delete-action"
                              onClick={() =>
                                deleteRecord(
                                  record.Id!
                                )
                              }
                              title="Delete record"
                            >
                              ×
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>
              )}

            </div>

            {/* PAGINATION */}

            {pagination && !search && (
              <div className="pagination-bar">

                <div className="pagination-summary">

                  Showing page{" "}
                  <strong>
                    {currentPage}
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {totalPages}
                  </strong>

                  <span className="pagination-divider">
                    •
                  </span>

                  <strong>
                    {totalRecords}
                  </strong>{" "}
                  total records

                </div>

                <div className="pagination-controls">

                  <button
                    className="pagination-button"
                    disabled={
                      !pagination.has_previous_page ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (previous) =>
                          previous - 1
                      )
                    }
                  >
                    ← Previous
                  </button>

                  <div className="page-number">
                    {currentPage}
                  </div>

                  <button
                    className="pagination-button"
                    disabled={
                      !pagination.has_next_page ||
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (previous) =>
                          previous + 1
                      )
                    }
                  >
                    Next →
                  </button>

                </div>

              </div>
            )}

          </section>

          {/* INFO CARDS */}

          <section className="bottom-info-grid">

            <div className="info-card">

              <div className="info-card-icon">
                ↗
              </div>

              <div>

                <strong>
                  Salesforce Integration
                </strong>

                <p>
                  CloudCRM is connected to your
                  Salesforce organization and ready
                  for live CRM management.
                </p>

              </div>

              <span className="info-check">
                ✓
              </span>

            </div>

            <div className="info-card">

              <div className="info-card-icon">
                ⚡
              </div>

              <div>

                <strong>
                  Real-time Workspace
                </strong>

                <p>
                  Create, edit, view and delete
                  Salesforce records directly from
                  this dashboard.
                </p>

              </div>

              <span className="info-check">
                ✓
              </span>

            </div>

          </section>

        </main>

        {/* FOOTER */}

        <footer className="app-footer">

          <div>

            <strong>
              CloudCRM
            </strong>

            <span>
              Salesforce CRM Management System
            </span>

          </div>

          <div>

            Developed by{" "}
            <strong>
              Chethan Dasaraiahgari
            </strong>

            <span className="footer-dot">
              •
            </span>

            Node.js + Express + Salesforce REST API

          </div>

        </footer>

      </div>

      {/* ======================================================
          CREATE / EDIT MODAL
          ====================================================== */}

      {showCreate && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCreate(false);
            }
          }}
        >

          <div className="modal premium-modal">

            <div className="modal-header">

              <div className="modal-title-wrapper">

                <div className="modal-object-icon">
                  {objectIcons[selectedObject]}
                </div>

                <div>

                  <span className="modal-kicker">
                    SALESFORCE RECORD
                  </span>

                  <h2>
                    {editingId
                      ? "Edit"
                      : "Create"}{" "}
                    {selectedObject}
                  </h2>

                </div>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowCreate(false)
                }
              >
                ×
              </button>

            </div>

            <div className="form-description">

              {editingId
                ? `Update the information for this ${selectedObject.toLowerCase()} record.`
                : `Enter the information below to create a new ${selectedObject.toLowerCase()} in Salesforce.`}

            </div>

            <div className="form">

              {fields
                .filter((field) => {

                  if (field.name === "Id") {
                    return false;
                  }

                  if (editingId) {
                    return field.updateable;
                  }

                  return field.createable;
                })
                .slice(0, 14)
                .map((field) => (

                  <div
                    className="form-group"
                    key={field.name}
                  >

                    <label>

                      {field.label ||
                        field.name}

                      {field.required && (
                        <span className="required">
                          *
                        </span>
                      )}

                    </label>

                    {field.type ===
                    "textarea" ? (

                      <textarea
                        value={
                          formData[
                            field.name
                          ] || ""
                        }
                        placeholder={`Enter ${(
                          field.label ||
                          field.name
                        ).toLowerCase()}`}
                        onChange={(e) =>
                          handleInputChange(
                            field.name,
                            e.target.value
                          )
                        }
                      />

                    ) : field.type ===
                        "picklist" &&
                      field.picklistValues
                        ?.length > 0 ? (

                      <select
                        value={
                          formData[
                            field.name
                          ] || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            field.name,
                            e.target.value
                          )
                        }
                      >

                        <option value="">
                          Select{" "}
                          {field.label ||
                            field.name}
                        </option>

                        {field.picklistValues.map(
                          (
                            value: string
                          ) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {value}
                            </option>
                          )
                        )}

                      </select>

                    ) : (

                      <input
                        type={
                          field.type ===
                          "email"
                            ? "email"
                            : field.type ===
                              "url"
                            ? "url"
                            : field.type ===
                              "date"
                            ? "date"
                            : field.type ===
                              "number"
                            ? "number"
                            : "text"
                        }
                        value={
                          formData[
                            field.name
                          ] || ""
                        }
                        placeholder={`Enter ${(
                          field.label ||
                          field.name
                        ).toLowerCase()}`}
                        onChange={(e) =>
                          handleInputChange(
                            field.name,
                            e.target.value
                          )
                        }
                      />

                    )}

                  </div>

                ))}

              <div className="form-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowCreate(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button save-button"
                  onClick={saveRecord}
                  disabled={loading}
                >

                  {loading ? (
                    <>
                      <span className="button-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId
                        ? "✓ Update Record"
                        : "＋ Create Record"}
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          VIEW RECORD MODAL
          ====================================================== */}

      {showView && viewRecord && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowView(false);
            }
          }}
        >

          <div className="modal view-modal">

            <div className="modal-header">

              <div className="modal-title-wrapper">

                <div className="modal-object-icon">
                  {objectIcons[selectedObject]}
                </div>

                <div>

                  <span className="modal-kicker">
                    RECORD DETAILS
                  </span>

                  <h2>
                    {selectedObject}
                  </h2>

                </div>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowView(false)
                }
              >
                ×
              </button>

            </div>

            <div className="record-detail-header">

              <div className="record-large-icon">
                {objectIcons[selectedObject]}
              </div>

              <div>

                <span>
                  RECORD ID
                </span>

                <strong>
                  {viewRecord.Id}
                </strong>

              </div>

              <div className="record-status">

                <span className="status-dot" />

                Salesforce Record

              </div>

            </div>

            <div className="details-grid">

              {Object.entries(viewRecord)
                .filter(
                  ([key]) =>
                    key !== "attributes"
                )
                .slice(0, 24)
                .map(
                  ([key, value]) => (
                    <div
                      className="detail-item"
                      key={key}
                    >

                      <span>

                        {key
                          .replace(
                            /([A-Z])/g,
                            " $1"
                          )
                          .replace(
                            /^./,
                            (char) =>
                              char.toUpperCase()
                          )}

                      </span>

                      <strong>

                        {value === null ||
                        value === undefined ||
                        value === ""
                          ? "—"
                          : String(value)}

                      </strong>

                    </div>
                  )
                )}

            </div>

            <div className="view-actions">

              <button
                className="secondary-button"
                onClick={() =>
                  setShowView(false)
                }
              >
                Close
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  setShowView(false);
                  startEdit(viewRecord);
                }}
              >
                ✎ Edit Record
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          TOAST NOTIFICATIONS
          ====================================================== */}

      <div className="toast-container">

        {toasts.map((toast) => (

          <div
            className={`toast toast-${toast.type}`}
            key={toast.id}
          >

            <div className="toast-icon">

              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                ? "!"
                : "i"}

            </div>

            <div className="toast-message">
              {toast.message}
            </div>

            <button
              onClick={() =>
                setToasts((previous) =>
                  previous.filter(
                    (item) =>
                      item.id !== toast.id
                  )
                )
              }
            >
              ×
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default App;