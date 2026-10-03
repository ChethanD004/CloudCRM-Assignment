const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

// =====================================================
// CLOUDCRM
// Professional Salesforce CRM Platform
// =====================================================

const PORT = process.env.PORT || 5000;
const SALESFORCE_API_VERSION = "v65.0";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const SALESFORCE_LOGIN_URL =
  "https://login.salesforce.com/services/oauth2";

const SUPPORTED_OBJECTS = [
  "Account",
  "Contact",
  "Lead",
  "Opportunity",
  "Case",
];

const SERVER_START_TIME = Date.now();

const CLOUDCRM_USERNAME =
  process.env.CLOUDCRM_USERNAME || "admin";

const CLOUDCRM_PASSWORD =
  process.env.CLOUDCRM_PASSWORD || "admin123";

// =====================================================
// APPLICATION STATE
// =====================================================

let salesforceAccessToken = null;
let salesforceRefreshToken = null;
let salesforceInstanceUrl = null;
let salesforceUserInfo = null;

// PKCE temporary storage
const pkceStore = new Map();

// =====================================================
// OBJECT CONFIGURATION
// =====================================================

const OBJECT_CONFIG = {
  Account: {
    fields: [
      "Id",
      "Name",
      "Industry",
      "Phone",
      "Website",
    ],
    searchFields: [
      "Name",
      "Industry",
      "Phone",
    ],
  },

  Contact: {
    fields: [
      "Id",
      "FirstName",
      "LastName",
      "Email",
      "Phone",
      "AccountId",
    ],
    searchFields: [
      "FirstName",
      "LastName",
      "Email",
      "Phone",
    ],
  },

  Lead: {
    fields: [
      "Id",
      "FirstName",
      "LastName",
      "Company",
      "Email",
      "Phone",
      "Status",
    ],
    searchFields: [
      "FirstName",
      "LastName",
      "Company",
      "Email",
      "Phone",
    ],
  },

  Opportunity: {
    fields: [
      "Id",
      "Name",
      "Amount",
      "StageName",
      "CloseDate",
      "AccountId",
    ],
    searchFields: [
      "Name",
      "StageName",
    ],
  },

  Case: {
    fields: [
      "Id",
      "CaseNumber",
      "Subject",
      "Status",
      "Priority",
      "AccountId",
    ],
    searchFields: [
      "CaseNumber",
      "Subject",
      "Status",
      "Priority",
    ],
  },
};

// =====================================================
// PROFESSIONAL LOGGING
// =====================================================

function timestamp() {
  return new Date().toISOString();
}

function generateRequestId() {
  return crypto.randomBytes(6).toString("hex");
}

function logInfo(message, data = null) {
  console.log(
    `[${timestamp()}] [INFO] ${message}`,
    data || ""
  );
}

function logSuccess(message, data = null) {
  console.log(
    `[${timestamp()}] [SUCCESS] ${message}`,
    data || ""
  );
}

function logWarning(message, data = null) {
  console.warn(
    `[${timestamp()}] [WARNING] ${message}`,
    data || ""
  );
}

function logError(message, data = null) {
  console.error(
    `[${timestamp()}] [ERROR] ${message}`,
    data || ""
  );
}

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  const requestId = generateRequestId();
  const startedAt = Date.now();

  req.requestId = requestId;

  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const duration = Date.now() - startedAt;

    const statusSymbol =
      res.statusCode >= 500
        ? "ERROR"
        : res.statusCode >= 400
        ? "WARN"
        : "OK";

    console.log(
      `[${timestamp()}] [${statusSymbol}] ` +
        `${req.method} ${req.originalUrl} ` +
        `${res.statusCode} ` +
        `${duration}ms ` +
        `request=${requestId}`
    );
  });

  next();
});

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

// =====================================================
// SECURITY / HEADERS
// =====================================================

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader(
    "X-Content-Type-Options",
    "nosniff"
  );

  res.setHeader(
    "X-Frame-Options",
    "SAMEORIGIN"
  );

  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  next();
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function isSalesforceConnected() {
  return Boolean(
    salesforceAccessToken &&
      salesforceInstanceUrl
  );
}

function checkSalesforceConnection(res) {
  if (!isSalesforceConnected()) {
    return res.status(401).json({
      success: false,
      connected: false,
      message:
        "Salesforce is not connected. Please login with Salesforce.",
    });
  }

  return true;
}

function isSupportedObject(objectName) {
  return SUPPORTED_OBJECTS.includes(objectName);
}

function getObjectConfig(objectName) {
  return OBJECT_CONFIG[objectName];
}

function salesforceApiUrl(path) {
  return `${salesforceInstanceUrl}/services/data/${SALESFORCE_API_VERSION}${path}`;
}

function escapeSoqlString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function getPage(value) {
  const page = parseInt(value, 10);

  if (
    !Number.isFinite(page) ||
    page < 1
  ) {
    return 1;
  }

  return page;
}

function getPageSize(value) {
  const size = parseInt(value, 10);

  if (!Number.isFinite(size)) {
    return 20;
  }

  return Math.min(
    Math.max(size, 1),
    100
  );
}

function cleanRecordData(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    return null;
  }

  const cleaned = {};

  Object.entries(data).forEach(
    ([key, value]) => {
      if (key === "Id") {
        return;
      }

      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
  );

  return cleaned;
}

function sendSalesforceError(
  res,
  error,
  defaultMessage
) {
  const status =
    error.response?.status || 500;

  const details =
    error.response?.data || {
      message: error.message,
    };

  logError(
    "Salesforce API request failed",
    {
      status,
      details,
    }
  );

  return res.status(status).json({
    success: false,
    message: defaultMessage,
    error: details,
  });
}

function getSafeUserInfo() {
  if (!salesforceUserInfo) {
    return null;
  }

  return {
    user_id:
      salesforceUserInfo.user_id || null,

    username:
      salesforceUserInfo.preferred_username ||
      null,

    display_name:
      salesforceUserInfo.name || null,

    email:
      salesforceUserInfo.email || null,
  };
}

function getUptime() {
  const seconds = Math.floor(
    (Date.now() - SERVER_START_TIME) /
      1000
  );

  const days = Math.floor(
    seconds / 86400
  );

  const hours = Math.floor(
    (seconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const remainingSeconds =
    seconds % 60;

  return {
    seconds,
    formatted:
      `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`,
  };
}

// =====================================================
// SALESFORCE TOKEN REFRESH
// =====================================================

async function refreshSalesforceAccessToken() {
  if (!salesforceRefreshToken) {
    throw new Error(
      "No Salesforce refresh token available."
    );
  }

  logInfo(
    "Refreshing Salesforce access token..."
  );

  try {
    const response = await axios.post(
      `${SALESFORCE_LOGIN_URL}/token`,
      new URLSearchParams({
        grant_type: "refresh_token",

        client_id:
          process.env.SALESFORCE_CLIENT_ID,

        client_secret:
          process.env.SALESFORCE_CLIENT_SECRET,

        refresh_token:
          salesforceRefreshToken,
      }).toString(),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        timeout: 15000,
      }
    );

    salesforceAccessToken =
      response.data.access_token;

    if (response.data.instance_url) {
      salesforceInstanceUrl =
        response.data.instance_url;
    }

    if (response.data.refresh_token) {
      salesforceRefreshToken =
        response.data.refresh_token;
    }

    logSuccess(
      "Salesforce access token refreshed successfully."
    );

    return salesforceAccessToken;
  } catch (error) {
    logError(
      "Salesforce token refresh failed",
      error.response?.data ||
        error.message
    );

    throw error;
  }
}

// =====================================================
// SALESFORCE REQUEST HELPER
// Automatically retries once after a 401.
// =====================================================

async function salesforceRequest(
  config,
  retry = true
) {
  if (!isSalesforceConnected()) {
    throw new Error(
      "Salesforce is not connected."
    );
  }

  try {
    return await axios({
      ...config,

      timeout:
        config.timeout || 20000,

      headers: {
        ...(config.headers || {}),

        Authorization:
          `Bearer ${salesforceAccessToken}`,
      },
    });
  } catch (error) {
    const status =
      error.response?.status;

    if (
      status === 401 &&
      retry &&
      salesforceRefreshToken
    ) {
      logWarning(
        "Salesforce returned 401. Attempting token refresh..."
      );

      await refreshSalesforceAccessToken();

      return salesforceRequest(
        config,
        false
      );
    }

    throw error;
  }
}

// =====================================================
// ROOT / HEALTH
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,

    application: "CloudCRM",

    message:
      "CloudCRM Backend is running successfully.",

    project: "CloudCRM Assignment",

    developer:
      "Chethan Dasaraiahgari",

    backend:
      "Node.js + Express",

    crm: "Salesforce",

    api_version:
      SALESFORCE_API_VERSION,

    status: "healthy",

    environment:
      process.env.NODE_ENV ||
      "development",

    uptime: getUptime(),

    salesforce_connected:
      isSalesforceConnected(),

    timestamp: timestamp(),

    request_id:
      req.requestId,
  });
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/health", (req, res) => {
  const connected =
    isSalesforceConnected();

  res.status(200).json({
    success: true,

    status: "healthy",

    service: "CloudCRM Backend",

    server: {
      status: "online",
      uptime: getUptime(),
      environment:
        process.env.NODE_ENV ||
        "development",
    },

    salesforce: {
      connected,
      api_version:
        SALESFORCE_API_VERSION,
      instance_url:
        salesforceInstanceUrl ||
        null,
    },

    timestamp: timestamp(),

    request_id:
      req.requestId,
  });
});

// =====================================================
// API INFORMATION
// =====================================================

app.get("/api/info", (req, res) => {
  res.json({
    success: true,

    project:
      "CloudCRM Assignment",

    application:
      "CloudCRM Professional CRM Platform",

    developer:
      "Chethan Dasaraiahgari",

    backend:
      "Node.js + Express",

    crm:
      "Salesforce",

    authentication:
      "OAuth 2.0 Authorization Code + PKCE",

    token_management:
      "Refresh Token",

    api:
      `Salesforce REST API ${SALESFORCE_API_VERSION}`,

    objects:
      SUPPORTED_OBJECTS,

    operations: [
      "CREATE",
      "READ",
      "VIEW",
      "UPDATE",
      "DELETE",
    ],

    features: {
      oauth: true,
      pkce: true,
      token_refresh: true,
      crud: true,
      search: true,
      pagination: true,
      metadata: true,
      dashboard_statistics: true,
      account_shortcuts: true,
      request_logging: true,
      health_check: true,
    },

    pagination:
      "20 records per page by default",

    maximum_page_size: 100,

    search:
      "Supported",

    salesforce_connected:
      isSalesforceConnected(),

    timestamp: timestamp(),

    request_id:
      req.requestId,
  });
});

// =====================================================
// CLOUDCRM USERNAME / PASSWORD LOGIN
// =====================================================

app.post(
  "/auth/local-login",
  (req, res) => {
    const {
      username,
      password,
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,

        message:
          "Username and password are required.",

        request_id:
          req.requestId,
      });
    }

    if (
      username === CLOUDCRM_USERNAME &&
      password === CLOUDCRM_PASSWORD
    ) {
      logSuccess(
        "CloudCRM local login successful",
        {
          username,
          request_id:
            req.requestId,
        }
      );

      return res.json({
        success: true,

        message:
          "Login successful.",

        user: {
          username:
            CLOUDCRM_USERNAME,

          name:
            "CloudCRM User",
        },

        request_id:
          req.requestId,
      });
    }

    logWarning(
      "CloudCRM local login failed",
      {
        username,
        request_id:
          req.requestId,
      }
    );

    return res.status(401).json({
      success: false,

      message:
        "Invalid username or password.",

      request_id:
        req.requestId,
    });
  }
);

// =====================================================
// OAUTH LOGIN
// =====================================================

app.get(
  "/auth/login",
  (req, res) => {
    try {
      const codeVerifier =
        crypto
          .randomBytes(32)
          .toString("base64url");

      const codeChallenge =
        crypto
          .createHash("sha256")
          .update(codeVerifier)
          .digest("base64url");

      const state =
        crypto
          .randomBytes(24)
          .toString("hex");

      pkceStore.set(state, {
        codeVerifier,
        createdAt: Date.now(),
      });

      setTimeout(() => {
        pkceStore.delete(state);
      }, 10 * 60 * 1000);

      const authUrl =
        `${SALESFORCE_LOGIN_URL}/authorize` +
        `?response_type=code` +
        `&client_id=${encodeURIComponent(
          process.env.SALESFORCE_CLIENT_ID
        )}` +
        `&redirect_uri=${encodeURIComponent(
          process.env.SALESFORCE_REDIRECT_URI
        )}` +
        `&code_challenge=${encodeURIComponent(
          codeChallenge
        )}` +
        `&code_challenge_method=S256` +
        `&state=${encodeURIComponent(
          state
        )}`;

      logSuccess(
        "Salesforce OAuth login initiated",
        {
          request_id:
            req.requestId,
          pkce: true,
        }
      );

      res.redirect(authUrl);
    } catch (error) {
      logError(
        "OAuth Login Error",
        error.message
      );

      res.status(500).json({
        success: false,

        message:
          "Failed to start Salesforce login.",

        request_id:
          req.requestId,
      });
    }
  }
);

// =====================================================
// OAUTH CALLBACK
// =====================================================

app.get(
  "/auth/callback",
  async (req, res) => {
    const {
      code,
      state,
      error,
      error_description,
    } = req.query;

    if (error) {
      logError(
        "Salesforce authorization error",
        {
          error,
          error_description,
          request_id:
            req.requestId,
        }
      );

      return res.status(400).json({
        success: false,

        message:
          "Salesforce authorization failed.",

        error,

        error_description,

        request_id:
          req.requestId,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,

        message:
          "Authorization code was not received.",

        request_id:
          req.requestId,
      });
    }

    if (
      !state ||
      !pkceStore.has(state)
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid or expired OAuth state.",

        request_id:
          req.requestId,
      });
    }

    const pkceData =
      pkceStore.get(state);

    pkceStore.delete(state);

    try {
      const response =
        await axios.post(
          `${SALESFORCE_LOGIN_URL}/token`,

          new URLSearchParams({
            grant_type:
              "authorization_code",

            code,

            client_id:
              process.env.SALESFORCE_CLIENT_ID,

            client_secret:
              process.env.SALESFORCE_CLIENT_SECRET,

            redirect_uri:
              process.env.SALESFORCE_REDIRECT_URI,

            code_verifier:
              pkceData.codeVerifier,
          }).toString(),

          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },

            timeout: 15000,
          }
        );

      salesforceAccessToken =
        response.data.access_token;

      salesforceRefreshToken =
        response.data.refresh_token ||
        null;

      salesforceInstanceUrl =
        response.data.instance_url;

      logSuccess(
        "Salesforce OAuth authentication successful",
        {
          instance_url:
            salesforceInstanceUrl,

          access_token:
            "RECEIVED",

          refresh_token:
            salesforceRefreshToken
              ? "RECEIVED"
              : "NOT RECEIVED",

          pkce:
            "VERIFIED",

          request_id:
            req.requestId,
        }
      );

      try {
        const userResponse =
          await salesforceRequest({
            method: "GET",

            url:
              `${salesforceInstanceUrl}` +
              `/services/oauth2/userinfo`,
          });

        salesforceUserInfo =
          userResponse.data;

        logSuccess(
          "Salesforce user profile retrieved",
          {
            username:
              salesforceUserInfo.preferred_username ||
              "Unknown",
          }
        );
      } catch (userError) {
        logWarning(
          "Could not retrieve Salesforce user info",
          userError.response?.data ||
            userError.message
        );
      }

      return res.redirect(
        `${FRONTEND_URL}?connected=true`
      );
    } catch (error) {
      logError(
        "Salesforce OAuth Error",
        error.response?.data ||
          error.message
      );

      return res.status(500).json({
        success: false,

        message:
          "Salesforce OAuth failed.",

        error:
          error.response?.data ||
          error.message,

        request_id:
          req.requestId,
      });
    }
  }
);

// =====================================================
// SALESFORCE STATUS
// =====================================================

app.get(
  "/salesforce/status",
  (req, res) => {
    const connected =
      isSalesforceConnected();

    res.json({
      success: true,

      connected,

      message: connected
        ? "Salesforce is connected."
        : "Salesforce is not connected.",

      instance_url:
        salesforceInstanceUrl ||
        null,

      user:
        getSafeUserInfo(),

      api_version:
        SALESFORCE_API_VERSION,

      request_id:
        req.requestId,

      timestamp:
        timestamp(),
    });
  }
);

// =====================================================
// SALESFORCE USER
// =====================================================

app.get(
  "/salesforce/user",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    try {
      const response =
        await salesforceRequest({
          method: "GET",

          url:
            `${salesforceInstanceUrl}` +
            `/services/oauth2/userinfo`,
        });

      salesforceUserInfo =
        response.data;

      res.json({
        success: true,

        message:
          "Salesforce user information retrieved successfully.",

        user:
          response.data,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to retrieve Salesforce user information."
      );
    }
  }
);

// =====================================================
// LOGOUT
// =====================================================

app.post(
  "/auth/logout",
  (req, res) => {
    salesforceAccessToken = null;

    salesforceRefreshToken = null;

    salesforceInstanceUrl = null;

    salesforceUserInfo = null;

    logSuccess(
      "Salesforce session cleared",
      {
        request_id:
          req.requestId,
      }
    );

    res.json({
      success: true,

      message:
        "Salesforce session cleared successfully.",

      connected: false,

      request_id:
        req.requestId,
    });
  }
);

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

app.get(
  "/salesforce/dashboard",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    try {
      const results = {};

      await Promise.all(
        SUPPORTED_OBJECTS.map(
          async (objectName) => {
            const response =
              await salesforceRequest({
                method: "GET",

                url:
                  salesforceApiUrl(
                    "/query"
                  ),

                params: {
                  q:
                    `SELECT COUNT() FROM ${objectName}`,
                },
              });

            results[objectName] =
              response.data.totalSize ||
              0;
          }
        )
      );

      const total =
        Object.values(results).reduce(
          (sum, value) =>
            sum + value,
          0
        );

      res.json({
        success: true,

        statistics:
          results,

        total_records:
          total,

        objects:
          SUPPORTED_OBJECTS.length,

        request_id:
          req.requestId,

        timestamp:
          timestamp(),
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to retrieve dashboard statistics."
      );
    }
  }
);

// =====================================================
// OBJECT METADATA
// =====================================================

app.get(
  "/salesforce/metadata/:objectName",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const objectName =
      req.params.objectName;

    if (
      !isSupportedObject(
        objectName
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported Salesforce object.",

        supported_objects:
          SUPPORTED_OBJECTS,

        request_id:
          req.requestId,
      });
    }

    try {
      const response =
        await salesforceRequest({
          method: "GET",

          url:
            salesforceApiUrl(
              `/sobjects/${objectName}/describe`
            ),
        });

      const fields =
        response.data.fields.map(
          (field) => ({
            name:
              field.name,

            label:
              field.label,

            type:
              field.type,

            createable:
              field.createable,

            updateable:
              field.updateable,

            nillable:
              field.nillable,

            required:
              field.createable &&
              !field.nillable &&
              !field.defaultedOnCreate,

            length:
              field.length || null,

            precision:
              field.precision || null,

            scale:
              field.scale || null,

            referenceTo:
              field.referenceTo || [],

            relationshipName:
              field.relationshipName ||
              null,

            picklistValues:
              field.picklistValues
                ?.filter(
                  (item) =>
                    item.active
                )
                .map(
                  (item) => ({
                    label:
                      item.label,

                    value:
                      item.value,

                    defaultValue:
                      item.defaultValue,
                  })
                ) || [],
          })
        );

      res.json({
        success: true,

        object:
          objectName,

        label:
          response.data.label,

        fields,

        field_count:
          fields.length,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to retrieve Salesforce object metadata."
      );
    }
  }
);

// =====================================================
// GET RECORDS WITH PAGINATION + SEARCH
// =====================================================

app.get(
  "/salesforce/records/:objectName",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const objectName =
      req.params.objectName;

    if (
      !isSupportedObject(
        objectName
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported Salesforce object.",

        supported_objects:
          SUPPORTED_OBJECTS,

        request_id:
          req.requestId,
      });
    }

    const config =
      getObjectConfig(
        objectName
      );

    const page =
      getPage(
        req.query.page
      );

    const pageSize =
      getPageSize(
        req.query.pageSize
      );

    const search =
      typeof req.query.search ===
      "string"
        ? req.query.search.trim()
        : "";

    const offset =
      (page - 1) *
      pageSize;

    try {
      // COUNT QUERY

      let countSoql =
        `SELECT COUNT() FROM ${objectName}`;

      if (search) {
        const safeSearch =
          escapeSoqlString(
            search
          );

        const searchConditions =
          config.searchFields.map(
            (field) =>
              `${field} LIKE '%${safeSearch}%'`
          );

        countSoql +=
          ` WHERE (${searchConditions.join(
            " OR "
          )})`;
      }

      const countResponse =
        await salesforceRequest({
          method: "GET",

          url:
            salesforceApiUrl(
              "/query"
            ),

          params: {
            q: countSoql,
          },
        });

      const totalRecords =
        countResponse.data.totalSize ||
        0;

      const totalPages =
        Math.ceil(
          totalRecords /
            pageSize
        );

      // RECORD QUERY

      let soql =
        `SELECT ${config.fields.join(
          ","
        )} FROM ${objectName}`;

      if (search) {
        const safeSearch =
          escapeSoqlString(
            search
          );

        const searchConditions =
          config.searchFields.map(
            (field) =>
              `${field} LIKE '%${safeSearch}%'`
          );

        soql +=
          ` WHERE (${searchConditions.join(
            " OR "
          )})`;
      }

      soql +=
        ` ORDER BY CreatedDate DESC` +
        ` LIMIT ${pageSize}` +
        ` OFFSET ${offset}`;

      const response =
        await salesforceRequest({
          method: "GET",

          url:
            salesforceApiUrl(
              "/query"
            ),

          params: {
            q: soql,
          },
        });

      const records =
        response.data.records ||
        [];

      res.json({
        success: true,

        object:
          objectName,

        search,

        pagination: {
          current_page:
            page,

          page_size:
            pageSize,

          total_records:
            totalRecords,

          total_pages:
            totalPages,

          has_previous_page:
            page > 1,

          has_next_page:
            page < totalPages,
        },

        records,

        record_count:
          records.length,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        `Failed to retrieve ${objectName} records.`
      );
    }
  }
);

// =====================================================
// VIEW SINGLE RECORD
// =====================================================

app.get(
  "/salesforce/records/:objectName/:id",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const objectName =
      req.params.objectName;

    const recordId =
      req.params.id;

    if (
      !isSupportedObject(
        objectName
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported Salesforce object.",

        supported_objects:
          SUPPORTED_OBJECTS,

        request_id:
          req.requestId,
      });
    }

    if (!recordId) {
      return res.status(400).json({
        success: false,

        message:
          "Record ID is required.",

        request_id:
          req.requestId,
      });
    }

    try {
      const response =
        await salesforceRequest({
          method: "GET",

          url:
            salesforceApiUrl(
              `/sobjects/${objectName}/${recordId}`
            ),
        });

      res.json({
        success: true,

        message:
          "Salesforce record retrieved successfully.",

        object:
          objectName,

        record:
          response.data,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to retrieve Salesforce record."
      );
    }
  }
);

// =====================================================
// CREATE RECORD
// =====================================================

app.post(
  "/salesforce/records/:objectName",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const objectName =
      req.params.objectName;

    if (
      !isSupportedObject(
        objectName
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported Salesforce object.",

        supported_objects:
          SUPPORTED_OBJECTS,

        request_id:
          req.requestId,
      });
    }

    const recordData =
      cleanRecordData(
        req.body
      );

    if (
      !recordData ||
      Object.keys(
        recordData
      ).length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Request body cannot be empty.",

        request_id:
          req.requestId,
      });
    }

    try {
      const response =
        await salesforceRequest({
          method: "POST",

          url:
            salesforceApiUrl(
              `/sobjects/${objectName}`
            ),

          data:
            recordData,

          headers: {
            "Content-Type":
              "application/json",
          },
        });

      logSuccess(
        `${objectName} record created`,
        {
          request_id:
            req.requestId,
        }
      );

      res.status(201).json({
        success: true,

        message:
          `${objectName} created successfully.`,

        object:
          objectName,

        record:
          response.data,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        `Failed to create ${objectName}.`
      );
    }
  }
);

// =====================================================
// UPDATE RECORD
// =====================================================

app.patch(
  "/salesforce/records/:objectName/:id",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const objectName =
      req.params.objectName;

    const recordId =
      req.params.id;

    if (
      !isSupportedObject(
        objectName
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported Salesforce object.",

        supported_objects:
          SUPPORTED_OBJECTS,

        request_id:
          req.requestId,
      });
    }

    const updateData =
      cleanRecordData(
        req.body
      );

    if (
      !updateData ||
      Object.keys(
        updateData
      ).length === 0
    ) {
      return res.status(400).json({
        success: false,

        message:
          "No fields provided for update.",

        request_id:
          req.requestId,
      });
    }

    try {
      await salesforceRequest({
        method: "PATCH",

        url:
          salesforceApiUrl(
            `/sobjects/${objectName}/${recordId}`
          ),

        data:
          updateData,

        headers: {
          "Content-Type":
            "application/json",
        },
      });

      logSuccess(
        `${objectName} record updated`,
        {
          record_id:
            recordId,

          request_id:
            req.requestId,
        }
      );

      res.json({
        success: true,

        message:
          `${objectName} updated successfully.`,

        object:
          objectName,

        record_id:
          recordId,

        updated_fields:
          updateData,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        `Failed to update ${objectName}.`
      );
    }
  }
);

// =====================================================
// DELETE RECORD
// =====================================================

app.delete(
  "/salesforce/records/:objectName/:id",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const objectName =
      req.params.objectName;

    const recordId =
      req.params.id;

    if (
      !isSupportedObject(
        objectName
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported Salesforce object.",

        supported_objects:
          SUPPORTED_OBJECTS,

        request_id:
          req.requestId,
      });
    }

    if (!recordId) {
      return res.status(400).json({
        success: false,

        message:
          "Record ID is required.",

        request_id:
          req.requestId,
      });
    }

    try {
      await salesforceRequest({
        method: "DELETE",

        url:
          salesforceApiUrl(
            `/sobjects/${objectName}/${recordId}`
          ),
      });

      logSuccess(
        `${objectName} record deleted`,
        {
          record_id:
            recordId,

          request_id:
            req.requestId,
        }
      );

      res.json({
        success: true,

        message:
          `${objectName} deleted successfully.`,

        object:
          objectName,

        record_id:
          recordId,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        `Failed to delete ${objectName}.`
      );
    }
  }
);

// =====================================================
// ACCOUNT SHORTCUT ENDPOINTS
// =====================================================

app.get(
  "/salesforce/accounts",
  async (req, res) => {
    const page =
      getPage(
        req.query.page
      );

    const pageSize =
      getPageSize(
        req.query.pageSize
      );

    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    const offset =
      (page - 1) *
      pageSize;

    try {
      const countResponse =
        await salesforceRequest({
          method: "GET",

          url:
            salesforceApiUrl(
              "/query"
            ),

          params: {
            q:
              "SELECT COUNT() FROM Account",
          },
        });

      const totalRecords =
        countResponse.data.totalSize ||
        0;

      const totalPages =
        Math.ceil(
          totalRecords /
            pageSize
        );

      const soql =
        `SELECT Id,Name,Industry,Phone,Website ` +
        `FROM Account ` +
        `ORDER BY CreatedDate DESC ` +
        `LIMIT ${pageSize} OFFSET ${offset}`;

      const response =
        await salesforceRequest({
          method: "GET",

          url:
            salesforceApiUrl(
              "/query"
            ),

          params: {
            q: soql,
          },
        });

      const accounts =
        response.data.records ||
        [];

      res.json({
        success: true,

        message:
          "Salesforce accounts retrieved successfully.",

        object:
          "Account",

        pagination: {
          current_page:
            page,

          page_size:
            pageSize,

          total_records:
            totalRecords,

          total_pages:
            totalPages,

          has_previous_page:
            page > 1,

          has_next_page:
            page < totalPages,
        },

        accounts,

        record_count:
          accounts.length,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to retrieve Salesforce accounts."
      );
    }
  }
);

app.post(
  "/salesforce/accounts",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    if (!req.body?.Name) {
      return res.status(400).json({
        success: false,

        message:
          "Account Name is required.",

        request_id:
          req.requestId,
      });
    }

    try {
      const response =
        await salesforceRequest({
          method: "POST",

          url:
            salesforceApiUrl(
              "/sobjects/Account"
            ),

          data:
            req.body,

          headers: {
            "Content-Type":
              "application/json",
          },
        });

      logSuccess(
        "Salesforce account created",
        {
          request_id:
            req.requestId,
        }
      );

      res.status(201).json({
        success: true,

        message:
          "Salesforce account created successfully.",

        account:
          response.data,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to create Salesforce account."
      );
    }
  }
);

app.patch(
  "/salesforce/accounts/:id",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    if (!req.params.id) {
      return res.status(400).json({
        success: false,

        message:
          "Account ID is required.",

        request_id:
          req.requestId,
      });
    }

    try {
      await salesforceRequest({
        method: "PATCH",

        url:
          salesforceApiUrl(
            `/sobjects/Account/${req.params.id}`
          ),

        data:
          req.body,

        headers: {
          "Content-Type":
            "application/json",
        },
      });

      logSuccess(
        "Salesforce account updated",
        {
          account_id:
            req.params.id,

          request_id:
            req.requestId,
        }
      );

      res.json({
        success: true,

        message:
          "Salesforce account updated successfully.",

        accountId:
          req.params.id,

        updatedFields:
          req.body,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to update Salesforce account."
      );
    }
  }
);

app.delete(
  "/salesforce/accounts/:id",
  async (req, res) => {
    if (
      !checkSalesforceConnection(res)
    ) {
      return;
    }

    if (!req.params.id) {
      return res.status(400).json({
        success: false,

        message:
          "Account ID is required.",

        request_id:
          req.requestId,
      });
    }

    try {
      await salesforceRequest({
        method: "DELETE",

        url:
          salesforceApiUrl(
            `/sobjects/Account/${req.params.id}`
          ),
      });

      logSuccess(
        "Salesforce account deleted",
        {
          account_id:
            req.params.id,

          request_id:
            req.requestId,
        }
      );

      res.json({
        success: true,

        message:
          "Salesforce account deleted successfully.",

        accountId:
          req.params.id,

        request_id:
          req.requestId,
      });
    } catch (error) {
      sendSalesforceError(
        res,
        error,
        "Failed to delete Salesforce account."
      );
    }
  }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "API endpoint not found.",

      path:
        req.originalUrl,

      method:
        req.method,

      available_endpoints: [
        "/",
        "/health",
        "/api/info",
        "/auth/login",
        "/auth/callback",
        "/auth/logout",
        "/salesforce/status",
        "/salesforce/user",
        "/salesforce/dashboard",
        "/salesforce/metadata/:objectName",
        "/salesforce/records/:objectName",
        "/salesforce/records/:objectName/:id",
        "/salesforce/accounts",
      ],

      request_id:
        req.requestId,

      timestamp:
        timestamp(),
    });
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    logError(
      "Unhandled Server Error",
      {
        message:
          error.message,

        stack:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.stack,

        request_id:
          req.requestId,
      }
    );

    res.status(500).json({
      success: false,

      message:
        "Internal server error.",

      request_id:
        req.requestId,

      timestamp:
        timestamp(),
    });
  }
);

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

function gracefulShutdown(signal) {
  console.log("");

  logWarning(
    `${signal} received. Shutting down CloudCRM backend...`
  );

  salesforceAccessToken = null;
  salesforceRefreshToken = null;
  salesforceInstanceUrl = null;
  salesforceUserInfo = null;

  pkceStore.clear();

  logSuccess(
    "CloudCRM backend shutdown completed."
  );

  process.exit(0);
}

process.on(
  "SIGINT",
  () =>
    gracefulShutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () =>
    gracefulShutdown("SIGTERM")
);

// =====================================================
// UNHANDLED PROMISE ERRORS
// =====================================================

process.on(
  "unhandledRejection",
  (reason) => {
    logError(
      "Unhandled Promise Rejection",
      reason
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    logError(
      "Uncaught Exception",
      error
    );
  }
);

// =====================================================
// START SERVER
// =====================================================

app.listen(
  PORT,
  () => {
    console.log("");

    console.log(
      "╔══════════════════════════════════════════════════════╗"
    );

    console.log(
      "║                ☁  CLOUDCRM BACKEND                 ║"
    );

    console.log(
      "║        Professional Salesforce CRM Platform         ║"
    );

    console.log(
      "╚══════════════════════════════════════════════════════╝"
    );

    console.log("");

    console.log(
      "┌──────────────────────────────────────────────────────┐"
    );

    console.log(
      "│ SERVER                                                │"
    );

    console.log(
      `│ Status        : ONLINE                               │`
    );

    console.log(
      `│ URL           : http://localhost:${PORT}                  │`
    );

    console.log(
      `│ Frontend      : ${FRONTEND_URL}`
    );

    console.log(
      `│ Environment   : ${
        process.env.NODE_ENV ||
        "development"
      }`
    );

    console.log(
      "└──────────────────────────────────────────────────────┘"
    );

    console.log("");

    console.log(
      "┌──────────────────────────────────────────────────────┐"
    );

    console.log(
      "│ SALESFORCE INTEGRATION                               │"
    );

    console.log(
      `│ API Version   : ${SALESFORCE_API_VERSION}                              │`
    );

    console.log(
      "│ OAuth         : Authorization Code + PKCE            │"
    );

    console.log(
      "│ Token Refresh : ENABLED                              │"
    );

    console.log(
      "│ REST API      : ENABLED                              │"
    );

    console.log(
      "│ CRUD          : ENABLED                              │"
    );

    console.log(
      "│ Search        : ENABLED                              │"
    );

    console.log(
      "│ Pagination    : ENABLED                              │"
    );

    console.log(
      "│ Metadata      : ENABLED                              │"
    );

    console.log(
      "└──────────────────────────────────────────────────────┘"
    );

    console.log("");

    console.log(
      "┌──────────────────────────────────────────────────────┐"
    );

    console.log(
      "│ SUPPORTED SALESFORCE OBJECTS                         │"
    );

    SUPPORTED_OBJECTS.forEach(
      (object, index) => {
        console.log(
          `│ ${String(index + 1).padEnd(
            2
          )}. ${object.padEnd(
            18
          )}                         │`
        );
      }
    );

    console.log(
      "└──────────────────────────────────────────────────────┘"
    );

    console.log("");

    console.log(
      "┌──────────────────────────────────────────────────────┐"
    );

    console.log(
      "│ API FEATURES                                          │"
    );

    console.log(
      "│ ✓ Salesforce OAuth + PKCE                            │"
    );

    console.log(
      "│ ✓ Automatic Token Refresh                            │"
    );

    console.log(
      "│ ✓ Dynamic Object Metadata                            │"
    );

    console.log(
      "│ ✓ Create / Read / Update / Delete                    │"
    );

    console.log(
      "│ ✓ Search & Pagination                                │"
    );

    console.log(
      "│ ✓ Dashboard Statistics                               │"
    );

    console.log(
      "│ ✓ Request ID Tracking                                │"
    );

    console.log(
      "│ ✓ Health Monitoring                                  │"
    );

    console.log(
      "│ ✓ Graceful Shutdown                                  │"
    );

    console.log(
      "└──────────────────────────────────────────────────────┘"
    );

    console.log("");

    console.log(
      "┌──────────────────────────────────────────────────────┐"
    );

    console.log(
      "│ DEVELOPER                                             │"
    );

    console.log(
      "│ Chethan Dasariaiahgari                               │"
    );

    console.log(
      "│ CloudCRM Assignment                                  │"
    );

    console.log(
      "└──────────────────────────────────────────────────────┘"
    );

    console.log("");

    console.log(
      "CloudCRM backend is ready for requests."
    );

    console.log(
      `Health: http://localhost:${PORT}/health`
    );

    console.log(
      `API Info: http://localhost:${PORT}/api/info`
    );

    console.log("");

    console.log(
      "════════════════════════════════════════════════════════"
    );

    console.log("");
  }
);