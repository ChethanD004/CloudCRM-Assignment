import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "https://cloudcrm-assignment.onrender.com";

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

type FieldData = {
  name: string;
  label: string;
  type: string;
  createable: boolean;
  updateable: boolean;
  required: boolean;
  nillable: boolean;
  picklistValues: string[];
};

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type DashboardCounts = Record<string, number>;

const fallbackFields: Record<string, FieldData[]> = {
  Account: [
    {
      name: "Name",
      label: "Account Name",
      type: "string",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "Industry",
      label: "Industry",
      type: "picklist",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [
        "Agriculture",
        "Apparel",
        "Banking",
        "Biotechnology",
        "Chemicals",
        "Communications",
        "Construction",
        "Consulting",
        "Education",
        "Electronics",
        "Energy",
        "Engineering",
        "Entertainment",
        "Environmental",
        "Finance",
        "Food & Beverage",
        "Government",
        "Healthcare",
        "Hospitality",
        "Insurance",
        "Machinery",
        "Manufacturing",
        "Media",
        "Not For Profit",
        "Recreation",
        "Retail",
        "Shipping",
        "Technology",
        "Telecommunications",
        "Transportation",
        "Utilities",
        "Other",
      ],
    },
    {
      name: "Phone",
      label: "Phone",
      type: "phone",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Website",
      label: "Website",
      type: "url",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Description",
      label: "Description",
      type: "textarea",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
  ],

  Contact: [
    {
      name: "FirstName",
      label: "First Name",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "LastName",
      label: "Last Name",
      type: "string",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "Email",
      label: "Email",
      type: "email",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Phone",
      label: "Phone",
      type: "phone",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "AccountId",
      label: "Account ID",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Title",
      label: "Job Title",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Department",
      label: "Department",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
  ],

  Lead: [
    {
      name: "FirstName",
      label: "First Name",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "LastName",
      label: "Last Name",
      type: "string",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "Company",
      label: "Company",
      type: "string",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "Email",
      label: "Email",
      type: "email",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Phone",
      label: "Phone",
      type: "phone",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Status",
      label: "Lead Status",
      type: "picklist",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [
        "Open - Not Contacted",
        "Working - Contacted",
        "Closed - Converted",
        "Closed - Not Converted",
      ],
    },
    {
      name: "Industry",
      label: "Industry",
      type: "picklist",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [
        "Agriculture",
        "Apparel",
        "Banking",
        "Biotechnology",
        "Construction",
        "Consulting",
        "Education",
        "Finance",
        "Healthcare",
        "Manufacturing",
        "Retail",
        "Technology",
        "Other",
      ],
    },
  ],

  Opportunity: [
    {
      name: "Name",
      label: "Opportunity Name",
      type: "string",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "Amount",
      label: "Amount",
      type: "number",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "StageName",
      label: "Stage",
      type: "picklist",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [
        "Prospecting",
        "Qualification",
        "Needs Analysis",
        "Value Proposition",
        "Id. Decision Makers",
        "Perception Analysis",
        "Proposal/Price Quote",
        "Negotiation/Review",
        "Closed Won",
        "Closed Lost",
      ],
    },
    {
      name: "CloseDate",
      label: "Close Date",
      type: "date",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "AccountId",
      label: "Account ID",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Probability",
      label: "Probability (%)",
      type: "number",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Description",
      label: "Description",
      type: "textarea",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
  ],

  Case: [
    {
      name: "Subject",
      label: "Subject",
      type: "string",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [],
    },
    {
      name: "Status",
      label: "Status",
      type: "picklist",
      createable: true,
      updateable: true,
      required: true,
      nillable: false,
      picklistValues: [
        "New",
        "Working",
        "Escalated",
        "Closed",
      ],
    },
    {
      name: "Priority",
      label: "Priority",
      type: "picklist",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [
        "High",
        "Medium",
        "Low",
      ],
    },
    {
      name: "Origin",
      label: "Case Origin",
      type: "picklist",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [
        "Phone",
        "Email",
        "Web",
      ],
    },
    {
      name: "AccountId",
      label: "Account ID",
      type: "string",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
    {
      name: "Description",
      label: "Description",
      type: "textarea",
      createable: true,
      updateable: true,
      required: false,
      nillable: true,
      picklistValues: [],
    },
  ],
};

function App() {
  const [connected, setConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);

  const [activePage, setActivePage] =
    useState<"dashboard" | "records">("dashboard");

  const [selectedObject, setSelectedObject] =
    useState("Account");

  const [records, setRecords] = useState<RecordData[]>([]);
  const [fields, setFields] = useState<FieldData[]>([]);

  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);

  const [formData, setFormData] = useState<RecordData>({});

  const [viewRecord, setViewRecord] =
    useState<RecordData | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboardCounts, setDashboardCounts] =
    useState<DashboardCounts>({});

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

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (!connected) return;

    loadDashboardCounts();

    if (activePage === "records") {
      loadData();
      loadMetadata();
    }
  }, [
    connected,
    activePage,
    selectedObject,
    page,
  ]);

  async function checkConnection() {
    try {
      setCheckingConnection(true);

      const response = await fetch(
        `${API}/salesforce/status`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.connected) {
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  }

  function connectSalesforce() {
    window.location.href = `${API}/auth/login`;
  }

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
        previous.filter(
          (toast) => toast.id !== id
        )
      );
    }, 4000);
  }

  async function loadDashboardCounts() {
    try {
      const response = await fetch(
        `${API}/salesforce/dashboard`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      const source =
        data.counts ||
        data.data?.counts ||
        data.dashboard ||
        data.data ||
        {};

      const normalized: DashboardCounts = {};

      objects.forEach((object) => {
        const lower = object.toLowerCase();

        normalized[object] =
          Number(
            source[object] ??
              source[lower] ??
              source[`${lower}s`] ??
              0
          ) || 0;
      });

      setDashboardCounts(normalized);
    } catch {
      // Keep dashboard working even if count API fails.
    }
  }

  async function loadData() {
    if (!connected) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/salesforce/records/${selectedObject}?page=${page}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to load ${selectedObject} records`
        );
      }

      const returnedRecords =
        data.records ||
        data.data?.records ||
        data.data ||
        [];

      setRecords(
        Array.isArray(returnedRecords)
          ? returnedRecords
          : []
      );

      setPagination(
        data.pagination ||
          data.data?.pagination ||
          null
      );
    } catch (err: any) {
      const message =
        err?.message ||
        `Unable to load ${selectedObject} records`;

      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMetadata() {
    if (!connected) return;

    setMetadataLoading(true);

    try {
      const response = await fetch(
        `${API}/salesforce/metadata/${selectedObject}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      const returnedFields =
        data.fields ||
        data.data?.fields ||
        data.data?.data?.fields ||
        [];

      if (
        response.ok &&
        Array.isArray(returnedFields) &&
        returnedFields.length > 0
      ) {
        const normalizedFields: FieldData[] =
          returnedFields
            .filter(
              (field: any) =>
                field &&
                field.name &&
                field.name !== "Id"
            )
            .map((field: any) => ({
              name: field.name,
              label:
                field.label ||
                field.name,
              type: normalizeFieldType(
                field.type
              ),
              createable:
                field.createable !== false,
              updateable:
                field.updateable !== false,
              required:
                field.required === true ||
                field.nillable === false,
              nillable:
                field.nillable !== false,
              picklistValues:
                extractPicklistValues(
                  field
                ),
            }));

        if (normalizedFields.length > 0) {
          setFields(normalizedFields);
          return;
        }
      }

      setFields(
        fallbackFields[selectedObject] || []
      );
    } catch {
      setFields(
        fallbackFields[selectedObject] || []
      );
    } finally {
      setMetadataLoading(false);
    }
  }

  function normalizeFieldType(
    type: string | undefined
  ): string {
    if (!type) return "string";

    const value = String(type).toLowerCase();

    if (
      value === "double" ||
      value === "currency" ||
      value === "percent" ||
      value === "integer"
    ) {
      return "number";
    }

    if (
      value === "datetime" ||
      value === "date" ||
      value === "textarea" ||
      value === "email" ||
      value === "url" ||
      value === "phone" ||
      value === "picklist"
    ) {
      return value;
    }

    return "string";
  }

  function extractPicklistValues(
    field: any
  ): string[] {
    const values =
      field.picklistValues ||
      field.picklist_values ||
      field.values ||
      [];

    if (!Array.isArray(values)) {
      return [];
    }

    return values
      .map((item: any) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.value ??
          item?.label ??
          ""
        );
      })
      .filter(Boolean);
  }

  async function refreshData() {
    if (activePage === "dashboard") {
      await loadDashboardCounts();

      showToast(
        "Dashboard refreshed successfully",
        "success"
      );

      return;
    }

    await Promise.all([
      loadData(),
      loadMetadata(),
      loadDashboardCounts(),
    ]);

    showToast(
      `${selectedObject} data refreshed`,
      "success"
    );
  }

  function openDashboard() {
    setActivePage("dashboard");
    setSidebarOpen(false);
    setSearch("");
    setError("");
  }

  function openObject(objectName: string) {
    setSelectedObject(objectName);
    setActivePage("records");
    setPage(1);
    setSearch("");
    setError("");
    setShowCreate(false);
    setShowView(false);
    setEditingId(null);
    setFormData({});
    setSidebarOpen(false);
  }

  async function startCreate() {
    setEditingId(null);
    setFormData({});
    setShowView(false);
    setError("");

    setShowCreate(true);

    if (
      fields.length === 0 ||
      fields.some(
        (field) =>
          field.createable === undefined
      )
    ) {
      await loadMetadata();
    }
  }

  async function startEdit(
    record: RecordData
  ) {
    const id = record.Id;

    if (!id) {
      showToast(
        "This record does not have a Salesforce ID.",
        "error"
      );
      return;
    }

    setShowView(false);

    if (fields.length === 0) {
      await loadMetadata();
    }

    const editableData: RecordData = {};

    const editableFields =
      fields.length > 0
        ? fields
        : fallbackFields[selectedObject] || [];

    editableFields.forEach((field) => {
      if (
        field.name !== "Id" &&
        field.updateable !== false &&
        record[field.name] !== undefined
      ) {
        editableData[field.name] =
          record[field.name];
      }
    });

    setEditingId(id);
    setFormData(editableData);
    setShowCreate(true);
  }

  function startView(record: RecordData) {
    setViewRecord(record);
    setShowView(true);
  }

  function handleInputChange(
    name: string,
    value: any
  ) {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function getFormFields(): FieldData[] {
    const sourceFields =
      fields.length > 0
        ? fields
        : fallbackFields[selectedObject] || [];

    return sourceFields.filter((field) => {
      if (!field.name || field.name === "Id") {
        return false;
      }

      if (editingId) {
        return field.updateable !== false;
      }

      return field.createable !== false;
    });
  }

  function validateForm(): boolean {
    const formFields = getFormFields();

    for (const field of formFields) {
      if (!field.required) continue;

      const value = formData[field.name];

      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        showToast(
          `${field.label} is required.`,
          "error"
        );

        return false;
      }
    }

    return true;
  }

  async function saveRecord() {
    if (!connected) {
      showToast(
        "Salesforce is not connected.",
        "error"
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url = editingId
        ? `${API}/salesforce/records/${selectedObject}/${editingId}`
        : `${API}/salesforce/records/${selectedObject}`;

      const method = editingId
        ? "PATCH"
        : "POST";

      const cleanedData: RecordData = {};

      Object.entries(formData).forEach(
        ([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {
            cleanedData[key] = value;
          }
        }
      );

      if (
        Object.keys(cleanedData).length === 0
      ) {
        throw new Error(
          "Please enter the record details."
        );
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type":
            "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            data.details ||
            `Failed to ${
              editingId
                ? "update"
                : "create"
            } ${selectedObject}`
        );
      }

      showToast(
        editingId
          ? `${selectedObject} updated successfully`
          : `${selectedObject} created successfully`,
        "success"
      );

      closeForm();

      await Promise.all([
        loadData(),
        loadDashboardCounts(),
      ]);
    } catch (err: any) {
      showToast(
        err?.message ||
          `Unable to save ${selectedObject}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function closeForm() {
    setShowCreate(false);
    setEditingId(null);
    setFormData({});
  }

  async function deleteRecord(id?: string) {
    if (!id) {
      showToast(
        "Salesforce record ID is missing.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete this ${selectedObject}?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/salesforce/records/${selectedObject}/${id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to delete ${selectedObject}`
        );
      }

      showToast(
        `${selectedObject} deleted successfully`,
        "success"
      );

      await Promise.all([
        loadData(),
        loadDashboardCounts(),
      ]);
    } catch (err: any) {
      showToast(
        err?.message ||
          `Unable to delete ${selectedObject}`,
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
    const value = record[field];

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    return String(value);
  }

  const filteredRecords = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return records;

    return records.filter((record) =>
      Object.entries(record).some(
        ([key, value]) => {
          if (key === "attributes") {
            return false;
          }

          return String(value ?? "")
            .toLowerCase()
            .includes(query);
        }
      )
    );
  }, [records, search]);

  const totalRecords =
    pagination?.total_records ??
    pagination?.totalRecords ??
    records.length;

  const currentPage =
    pagination?.current_page ??
    pagination?.currentPage ??
    page;

  const totalPages =
    pagination?.total_pages ??
    pagination?.totalPages ??
    1;

  const totalDashboardRecords = objects.reduce(
    (sum, object) =>
      sum + (dashboardCounts[object] || 0),
    0
  );

  const largestObjectCount = Math.max(
    ...objects.map(
      (object) => dashboardCounts[object] || 0
    ),
    1
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING SCREEN
  |--------------------------------------------------------------------------
  */

  if (checkingConnection) {
    return (
      <div className="app login-app">
        <div className="login-background">
          <div className="background-orb orb-one" />
          <div className="background-orb orb-two" />
          <div className="background-grid" />
        </div>

        <div className="login-wrapper">
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

          <div className="login-card">
            <div className="login-icon">
              <span>☁</span>
            </div>

            <div className="login-heading">
              <span className="eyebrow">
                CLOUDCRM
              </span>

              <h1>
                Checking connection
              </h1>

              <p>
                Connecting to your Salesforce
                workspace...
              </p>
            </div>

            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
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
                Sign in with Salesforce to
                manage your CRM records
                through one powerful
                workspace.
              </p>
            </div>

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
  |--------------------------------------------------------------------------
  | MAIN APPLICATION
  |--------------------------------------------------------------------------
  */

  return (
    <div className="app">
      <div
        className={`mobile-sidebar-overlay ${
          sidebarOpen ? "show" : ""
        }`}
        onClick={() =>
          setSidebarOpen(false)
        }
      />

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
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
          className={`sidebar-dashboard ${
            activePage === "dashboard"
              ? "active"
              : ""
          }`}
          onClick={openDashboard}
        >
          <span className="sidebar-icon">
            ⌂
          </span>

          <span>Dashboard</span>
        </button>

        <div className="sidebar-section-title records-title">
          CRM OBJECTS
        </div>

        <div className="sidebar-objects">
          {objects.map((object) => (
            <button
              key={object}
              className={`sidebar-object ${
                activePage === "records" &&
                selectedObject === object
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                openObject(object)
              }
            >
              <span className="object-small-icon">
                {objectIcons[object]}
              </span>

              <span className="sidebar-object-content">
                <strong>{object}</strong>

                <small>
                  {objectDescriptions[object]}
                </small>
              </span>

              {activePage === "records" &&
                selectedObject === object && (
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
              <strong>Chethan</strong>

              <small>
                Administrator
              </small>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <div className="main-area">
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
                Workspace

                <span>/</span>

                {activePage === "dashboard"
                  ? "Dashboard"
                  : selectedObject}
              </div>

              <h1>
                {activePage === "dashboard"
                  ? "CRM Dashboard"
                  : `${selectedObject} Management`}
              </h1>
            </div>
          </div>

          <div className="topbar-right">
            <div className="live-status">
              <span className="status-dot" />

              <span>Connected</span>
            </div>

            <button
              className="top-refresh"
              onClick={refreshData}
              disabled={
                loading ||
                metadataLoading
              }
              title="Refresh"
            >
              ↻
            </button>

            <div className="profile">
              <div className="profile-avatar">
                C
              </div>

              <div className="profile-info">
                <strong>Chethan</strong>

                <span>
                  Salesforce Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {/* ==========================================================
              NEW PROFESSIONAL DASHBOARD
              ========================================================== */}

          {activePage === "dashboard" && (
            <div className="new-dashboard">
              {/* HERO */}

              <section className="dashboard-hero">
                <div className="dashboard-hero-content">
                  <div className="hero-small-label">
                    <span className="hero-live-dot" />
                    SALESFORCE WORKSPACE
                  </div>

                  <h2>
                    Welcome back,
                    <br />
                    <span>Chethan.</span>
                  </h2>

                  <p>
                    Your Salesforce workspace is
                    connected and ready. Monitor
                    your CRM data and manage every
                    object from one place.
                  </p>

                  <div className="hero-actions">
                    <button
                      className="dashboard-primary-btn"
                      onClick={() =>
                        openObject("Account")
                      }
                    >
                      <span>Open CRM Workspace</span>
                      <span>→</span>
                    </button>

                    <button
                      className="dashboard-secondary-btn"
                      onClick={refreshData}
                      disabled={loading}
                    >
                      <span>↻</span>
                      Refresh data
                    </button>
                  </div>
                </div>

                <div className="hero-visual">
                  <div className="hero-glow" />

                  <div className="hero-cloud">
                    ☁
                  </div>

                  <div className="hero-ring ring-one" />
                  <div className="hero-ring ring-two" />

                  <div className="floating-card floating-card-one">
                    <span className="floating-icon">
                      ✓
                    </span>

                    <div>
                      <strong>
                        Salesforce
                      </strong>

                      <small>
                        Connected
                      </small>
                    </div>
                  </div>

                  <div className="floating-card floating-card-two">
                    <span className="floating-icon">
                      ↗
                    </span>

                    <div>
                      <strong>
                        Live Data
                      </strong>

                      <small>
                        Synced
                      </small>
                    </div>
                  </div>
                </div>
              </section>

              {/* OVERVIEW HEADER */}

              <section className="dashboard-section-heading">
                <div>
                  <span>
                    CRM OVERVIEW
                  </span>

                  <h3>
                    Your workspace at a glance
                  </h3>
                </div>

                <div className="dashboard-total">
                  <span>Total records</span>

                  <strong>
                    {totalDashboardRecords}
                  </strong>
                </div>
              </section>

              {/* STAT CARDS */}

              <section className="modern-stats-grid">
                {objects.map((object) => {
                  const count =
                    dashboardCounts[object] || 0;

                  return (
                    <button
                      key={object}
                      className={`modern-stat-card stat-${object.toLowerCase()}`}
                      onClick={() =>
                        openObject(object)
                      }
                    >
                      <div className="modern-stat-top">
                        <div className="modern-stat-icon">
                          {objectIcons[object]}
                        </div>

                        <span className="modern-stat-arrow">
                          ↗
                        </span>
                      </div>

                      <div className="modern-stat-number">
                        {count}
                      </div>

                      <div className="modern-stat-name">
                        {object}
                      </div>

                      <div className="modern-stat-description">
                        {objectDescriptions[object]}
                      </div>
                    </button>
                  );
                })}
              </section>

              {/* LOWER DASHBOARD */}

              <section className="dashboard-lower-grid">
                {/* OBJECT ACTIVITY */}

                <div className="dashboard-panel">
                  <div className="panel-heading">
                    <div>
                      <span>
                        DATA DISTRIBUTION
                      </span>

                      <h3>
                        CRM object activity
                      </h3>
                    </div>

                    <div className="panel-badge">
                      LIVE
                    </div>
                  </div>

                  <div className="distribution-list">
                    {objects.map((object) => {
                      const count =
                        dashboardCounts[
                          object
                        ] || 0;

                      const percentage =
                        totalDashboardRecords >
                        0
                          ? Math.round(
                              (count /
                                totalDashboardRecords) *
                                100
                            )
                          : 0;

                      const width =
                        count === 0
                          ? 3
                          : Math.max(
                              8,
                              Math.round(
                                (count /
                                  largestObjectCount) *
                                  100
                              )
                            );

                      return (
                        <button
                          key={object}
                          className="distribution-row"
                          onClick={() =>
                            openObject(
                              object
                            )
                          }
                        >
                          <div className="distribution-icon">
                            {objectIcons[object]}
                          </div>

                          <div className="distribution-main">
                            <div className="distribution-label">
                              <strong>
                                {object}
                              </strong>

                              <span>
                                {count} records
                              </span>
                            </div>

                            <div className="distribution-track">
                              <div
                                className="distribution-fill"
                                style={{
                                  width: `${width}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="distribution-percent">
                            {percentage}%
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* QUICK ACTIONS */}

                <div className="dashboard-panel quick-panel">
                  <div className="panel-heading">
                    <div>
                      <span>
                        QUICK ACCESS
                      </span>

                      <h3>
                        Manage your CRM
                      </h3>
                    </div>
                  </div>

                  <div className="quick-actions">
                    {objects.map((object) => (
                      <button
                        key={object}
                        className="quick-action"
                        onClick={() =>
                          openObject(object)
                        }
                      >
                        <div
                          className={`quick-action-icon quick-${object.toLowerCase()}`}
                        >
                          {objectIcons[object]}
                        </div>

                        <div className="quick-action-content">
                          <strong>
                            {object}
                          </strong>

                          <span>
                            {dashboardCounts[
                              object
                            ] || 0}{" "}
                            records
                          </span>
                        </div>

                        <span className="quick-arrow">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* SYSTEM STATUS */}

              <section className="dashboard-status-panel">
                <div className="system-status-left">
                  <div className="system-status-icon">
                    ✓
                  </div>

                  <div>
                    <span>
                      SYSTEM STATUS
                    </span>

                    <h3>
                      Salesforce integration
                      is active
                    </h3>

                    <p>
                      CloudCRM is connected to
                      Salesforce and receiving
                      live CRM data.
                    </p>
                  </div>
                </div>

                <div className="system-status-right">
                  <div className="status-item">
                    <span className="status-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        OAuth Connected
                      </strong>

                      <small>
                        Secure connection
                      </small>
                    </div>
                  </div>

                  <div className="status-item">
                    <span className="status-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        REST API
                      </strong>

                      <small>
                        Operational
                      </small>
                    </div>
                  </div>

                  <div className="status-item">
                    <span className="status-check">
                      ✓
                    </span>

                    <div>
                      <strong>
                        CRM Data
                      </strong>

                      <small>
                        Live
                      </small>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ==========================================================
              RECORDS PAGE
              ========================================================== */}

          {activePage === "records" && (
            <>
              <section className="welcome-section">
                <div>
                  <span className="eyebrow">
                    SALESFORCE OBJECT
                  </span>

                  <h2>
                    {selectedObject} Records
                  </h2>

                  <p>
                    View, create, edit and
                    delete{" "}
                    {selectedObject.toLowerCase()}{" "}
                    records directly in
                    Salesforce.
                  </p>
                </div>

                <button
                  className="primary-button hero-create"
                  onClick={startCreate}
                  disabled={loading}
                >
                  ＋ Create {selectedObject}
                </button>
              </section>

              <section className="stats-grid">
                {objects.map((object) => (
                  <button
                    className={`stat-card ${
                      selectedObject === object
                        ? "stat-selected"
                        : ""
                    }`}
                    key={object}
                    onClick={() =>
                      openObject(object)
                    }
                  >
                    <div className="stat-card-top">
                      <div
                        className={`stat-icon icon-${object.toLowerCase()}`}
                      >
                        {objectIcons[object]}
                      </div>

                      {selectedObject ===
                        object && (
                        <span className="selected-pill">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="stat-number">
                      {selectedObject === object
                        ? totalRecords
                        : dashboardCounts[
                            object
                          ] ?? "—"}
                    </div>

                    <div className="stat-label">
                      {object} Records
                    </div>

                    <div className="stat-description">
                      {objectDescriptions[
                        object
                      ]}
                    </div>
                  </button>
                ))}
              </section>

              <section className="workspace-card">
                <div className="workspace-header">
                  <div className="workspace-title">
                    <div className="workspace-object-icon">
                      {objectIcons[
                        selectedObject
                      ]}
                    </div>

                    <div>
                      <div className="workspace-kicker">
                        SALESFORCE OBJECT
                      </div>

                      <h2>
                        {selectedObject} Records
                      </h2>

                      <p>
                        {totalRecords} records
                        available in your
                        Salesforce workspace.
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

                <div className="toolbar">
                  <div className="search-box">
                    <span className="search-icon">
                      ⌕
                    </span>

                    <input
                      type="text"
                      placeholder={`Search ${selectedObject.toLowerCase()} records...`}
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
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
                          {
                            filteredRecords.length
                          }
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

                {error && (
                  <div className="error-banner">
                    <div className="error-symbol">
                      !
                    </div>

                    <div>
                      <strong>
                        Something went wrong
                      </strong>

                      <span>{error}</span>
                    </div>

                    <button
                      onClick={loadData}
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="table-wrapper">
                  {loading &&
                  records.length === 0 ? (
                    <div className="loading-state">
                      <div className="loading-spinner" />

                      <h3>
                        Loading{" "}
                        {selectedObject} records
                      </h3>

                      <p>
                        Connecting to
                        Salesforce...
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
                          ? "Try changing your search."
                          : `There are currently no ${selectedObject.toLowerCase()} records.`}
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
                            <tr
                              key={
                                record.Id ||
                                JSON.stringify(
                                  record
                                )
                              }
                            >
                              <td className="record-id">
                                <span className="record-dot" />

                                <span>
                                  {record.Id ||
                                    "-"}
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
                                    startView(
                                      record
                                    )
                                  }
                                  title="View record"
                                >
                                  ◉
                                </button>

                                <button
                                  className="icon-action edit-action"
                                  onClick={() =>
                                    startEdit(
                                      record
                                    )
                                  }
                                  title="Edit record"
                                >
                                  ✎
                                </button>

                                <button
                                  className="icon-action delete-action"
                                  onClick={() =>
                                    deleteRecord(
                                      record.Id
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

                {pagination &&
                  !search && (
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
                            !(
                              pagination.has_previous_page ??
                              pagination.hasPreviousPage
                            ) ||
                            loading
                          }
                          onClick={() =>
                            setPage(
                              (previous) =>
                                Math.max(
                                  1,
                                  previous - 1
                                )
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
                            !(
                              pagination.has_next_page ??
                              pagination.hasNextPage
                            ) ||
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
                      CloudCRM is connected to
                      Salesforce and is using
                      live CRM data.
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
                      Full CRUD Workspace
                    </strong>

                    <p>
                      View, create, update and
                      delete Salesforce records.
                    </p>
                  </div>

                  <span className="info-check">
                    ✓
                  </span>
                </div>
              </section>
            </>
          )}
        </main>

        <footer className="app-footer">
          <div>
            <strong>CloudCRM</strong>

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

            Node.js + Express + Salesforce REST
            API
          </div>
        </footer>
      </div>

      {/* ==========================================================
          CREATE / EDIT MODAL
          ========================================================== */}

      {showCreate && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div className="modal premium-modal">
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-object-icon">
                  {objectIcons[
                    selectedObject
                  ]}
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
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <div className="form-description">
              {editingId
                ? `Update the ${selectedObject.toLowerCase()} information and save the changes to Salesforce.`
                : `Enter the information below to create a new ${selectedObject.toLowerCase()} in Salesforce.`}
            </div>

            <div className="form">
              <div className="form-grid">
                {getFormFields().map(
                  (field) => {
                    const fieldValue =
                      formData[
                        field.name
                      ] ?? "";

                    const isPicklist =
                      field.type ===
                        "picklist" &&
                      Array.isArray(
                        field.picklistValues
                      ) &&
                      field.picklistValues
                        .length > 0;

                    return (
                      <div
                        className={`form-group ${
                          field.type ===
                          "textarea"
                            ? "full-width"
                            : ""
                        }`}
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

                        {isPicklist ? (
                          <select
                            value={String(
                              fieldValue
                            )}
                            onChange={(
                              event
                            ) =>
                              handleInputChange(
                                field.name,
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select{" "}
                              {(
                                field.label ||
                                field.name
                              ).toLowerCase()}
                            </option>

                            {field.picklistValues.map(
                              (
                                value
                              ) => (
                                <option
                                  key={
                                    value
                                  }
                                  value={
                                    value
                                  }
                                >
                                  {
                                    value
                                  }
                                </option>
                              )
                            )}
                          </select>
                        ) : field.type ===
                          "textarea" ? (
                          <textarea
                            value={String(
                              fieldValue
                            )}
                            placeholder={`Enter ${(
                              field.label ||
                              field.name
                            ).toLowerCase()}`}
                            onChange={(
                              event
                            ) =>
                              handleInputChange(
                                field.name,
                                event.target
                                  .value
                              )
                            }
                          />
                        ) : (
                          <input
                            type={getInputType(
                              field.type
                            )}
                            value={String(
                              fieldValue
                            )}
                            placeholder={`Enter ${(
                              field.label ||
                              field.name
                            ).toLowerCase()}`}
                            onChange={(
                              event
                            ) =>
                              handleInputChange(
                                field.name,
                                event.target
                                  .value
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>

              {getFormFields().length ===
                0 && (
                <div className="empty-state">
                  <h3>
                    No form fields available
                  </h3>

                  <p>
                    Please check your Salesforce
                    permissions.
                  </p>

                  <button
                    className="secondary-button"
                    onClick={
                      loadMetadata
                    }
                  >
                    Retry
                  </button>
                </div>
              )}

              {getFormFields().length >
                0 && (
                <div className="form-actions">
                  <button
                    className="secondary-button"
                    onClick={closeForm}
                    disabled={loading}
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          VIEW MODAL
          ========================================================== */}

      {showView &&
        viewRecord && (
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
                    {objectIcons[
                      selectedObject
                    ]}
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
                  {objectIcons[
                    selectedObject
                  ]}
                </div>

                <div>
                  <span>
                    RECORD ID
                  </span>

                  <strong>
                    {viewRecord.Id ||
                      "Unavailable"}
                  </strong>
                </div>

                <div className="record-status">
                  <span className="status-dot" />
                  Salesforce Record
                </div>
              </div>

              <div className="details-grid">
                {Object.entries(
                  viewRecord
                )
                  .filter(
                    ([key]) =>
                      key !== "attributes"
                  )
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
                          {value ===
                            null ||
                          value ===
                            undefined ||
                          value === ""
                            ? "—"
                            : String(
                                value
                              )}
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
                  onClick={() =>
                    startEdit(viewRecord)
                  }
                >
                  ✎ Edit Record
                </button>

                <button
                  className="delete-button"
                  onClick={async () => {
                    setShowView(false);

                    await deleteRecord(
                      viewRecord.Id
                    );
                  }}
                >
                  × Delete
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ==========================================================
          TOASTS
          ========================================================== */}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            className={`toast toast-${toast.type}`}
            key={toast.id}
          >
            <div className="toast-icon">
              {toast.type ===
              "success"
                ? "✓"
                : toast.type ===
                  "error"
                ? "!"
                : "i"}
            </div>

            <div className="toast-message">
              {toast.message}
            </div>

            <button
              onClick={() =>
                setToasts(
                  (previous) =>
                    previous.filter(
                      (item) =>
                        item.id !==
                        toast.id
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

function getInputType(
  type: string
): string {
  switch (type) {
    case "email":
      return "email";

    case "url":
      return "url";

    case "date":
      return "date";

    case "datetime":
      return "datetime-local";

    case "number":
      return "number";

    case "phone":
      return "tel";

    default:
      return "text";
  }
}

export default App;