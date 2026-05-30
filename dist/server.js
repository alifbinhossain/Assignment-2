
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  const responseData = {
    success: data.success,
    message: data.message,
    ...data.data !== void 0 ? { data: data.data } : {},
    ...data.errors !== void 0 ? { errors: data.errors } : {}
  };
  res.status(data.statusCode).json(responseData);
};
var serverError = (res, errors) => {
  return sendResponse(res, {
    statusCode: 500,
    success: false,
    message: errors.message,
    errors
  });
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
var config = {
  connection_string: process.env.CONNECTION_STRING,
  port: Number(process.env.PORT),
  secret: process.env.JWT_SECRET,
  secret_expiry: process.env.JWT_SECRET_EXPIRY,
  refresh_secret: process.env.JWT_REFRESH_SECRET,
  refresh_secret_expiry: process.env.JWT_REFRESH_SECRET_EXPIRY
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'contributor',
    
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
        `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,

        title VARCHAR(150) NOT NULL,
        description TEXT 
        NOT NULL 
        CHECK (char_length(description) >= 20),

        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'open',

        reporter_id INT REFERENCES users(id) ON DELETE CASCADE,

        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
        `);
    console.log(`Database connected successfully!`);
  } catch (error) {
    console.log({ error });
  }
};

// src/types/index.ts
var USER_ROLE = /* @__PURE__ */ ((USER_ROLE2) => {
  USER_ROLE2["CONTRIBUTOR"] = "contributor";
  USER_ROLE2["MAINTAINER"] = "maintainer";
  return USER_ROLE2;
})(USER_ROLE || {});
var ISSUE_STATUS = /* @__PURE__ */ ((ISSUE_STATUS2) => {
  ISSUE_STATUS2["OPEN"] = "open";
  ISSUE_STATUS2["IN_PROGRESS"] = "in_progress";
  ISSUE_STATUS2["RESOLVED"] = "resolved";
  return ISSUE_STATUS2;
})(ISSUE_STATUS || {});
var ISSUE_TYPE = /* @__PURE__ */ ((ISSUE_TYPE2) => {
  ISSUE_TYPE2["BUG"] = "bug";
  ISSUE_TYPE2["FEATURE_REQUEST"] = "feature_request";
  return ISSUE_TYPE2;
})(ISSUE_TYPE || {});

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
var createUser = async (payload) => {
  const { name, email, password, role } = payload;
  if (role && !Object.values(USER_ROLE).includes(role)) {
    throw new Error("User role must be contributor or maintainer");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
     INSERT INTO users(name,email,password,role) 
     VALUES($1,$2,$3,COALESCE($4,'contributor'))
     RETURNING *
        `,
    [name, email, hashedPassword, role]
  );
  return result;
};
var loginUser = async (payload) => {
  const { email, password } = payload;
  if (!email || !password) {
    throw new Error("Email and Password must be provided to login");
  }
  const result = await pool.query(
    `
    SELECT * FROM users
    WHERE email=$1
    `,
    [email]
  );
  const user = result.rows?.[0];
  if (!user) {
    throw new Error("User not found");
  }
  const matchedPassword = await bcrypt.compare(password, user.password);
  if (!matchedPassword) {
    throw new Error("Invalid credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const token = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: config_default.secret_expiry
  });
  delete user.password;
  return { token, user };
};
var authService = {
  createUser,
  loginUser
};

// src/modules/auth/auth.controller.ts
var signUp = async (req, res) => {
  try {
    const result = await authService.createUser(req.body);
    result.rows.forEach((_r) => delete _r.password);
    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    serverError(res, error);
  }
};
var login = async (req, res) => {
  try {
    const result = await authService.loginUser(req.body);
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    serverError(res, error);
  }
};
var authController = { signUp, login };

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
var authRouter = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issue/issue.service.ts
var createIssueToDB = async (reporter_id, payload) => {
  const user = await pool.query(
    `
        SELECT * FROM users
        WHERE id=$1
        `,
    [reporter_id]
  );
  if (user.rows.length === 0) {
    throw new Error("User not found");
  }
  const { title, description, type, status } = payload;
  if (!Object.values(ISSUE_TYPE).includes(type)) {
    throw new Error("Issue type must be either bug or feature_request");
  }
  if (status && !Object.values(ISSUE_STATUS).includes(status)) {
    throw new Error("Status must be one of: open, in_progress, resolved");
  }
  const result = await pool.query(
    `
    INSERT INTO issues (title,description,type,status,reporter_id)
    VALUES($1,$2,$3,COALESCE($4,'open'),$5)
    RETURNING *
    `,
    [title, description, type, status, reporter_id]
  );
  return result.rows?.[0];
};
var getAllIssuesFromDB = async (filters = {}) => {
  const { sort = "newest", type, status } = filters;
  const conditions = [];
  const values = [];
  if (type === "bug" || type === "feature_request") {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status === "open" || status === "in_progress" || status === "resolved") {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderDirection = sort === "oldest" ? "ASC" : "DESC";
  const result = await pool.query(
    `SELECT * FROM issues
     ${whereClause}
     ORDER BY created_at ${orderDirection}`,
    values
  );
  const reporterIds = [...new Set(result.rows.map((_r) => _r.reporter_id))];
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const reporterMap = Object.fromEntries(
    reportersResult.rows.map((r) => [r.id, r])
  );
  return result.rows.map((_r) => ({
    ..._r,
    reporter: reporterMap[_r.reporter_id] ?? null
  }));
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `SELECT
       i.id,
       i.title,
       i.description,
       i.type,
       i.status,
       json_build_object(
         'id', u.id,
         'name', u.name,
         'role', u.role
       ) AS reporter,
       i.created_at,
       i.updated_at
     FROM issues i
     JOIN users u ON u.id = i.reporter_id
     WHERE i.id = $1`,
    [id]
  );
  return result.rows?.[0] ?? void 0;
};
var updateIssueToDB = async (id, user, payload) => {
  const { title, description, type, status } = payload;
  if (user.role === "contributor") {
    const issueResult = await pool.query(
      `SELECT reporter_id FROM issues WHERE id = $1`,
      [id]
    );
    const issue = issueResult.rows?.[0];
    if (!issue) {
      throw new Error("Issue not found");
    }
    if (issue.reporter_id !== user.id) {
      throw new Error("You are not authorized to update this issue");
    }
  }
  const result = await pool.query(
    `
  UPDATE issues
  SET
  title=COALESCE($1,title),
  description=COALESCE($2,description),
  type=COALESCE($3,type),
  status=COALESCE($4,status)
  WHERE id=$5
  RETURNING *  
    `,
    [title, description, type, status, id]
  );
  return result.rows?.[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id=$1 RETURNING *
    `,
    [id]
  );
  return result.rowCount;
};
var issueService = {
  createIssueToDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueToDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createAnIssue = async (req, res) => {
  try {
    const result = await issueService.createIssueToDB(req?.user?.id, req.body);
    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    serverError(res, error);
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const data = await issueService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data
    });
  } catch (error) {
    serverError(res, error);
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getSingleIssueFromDB(id);
    if (!issue) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
        data: issue
      });
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: issue
    });
  } catch (error) {
    serverError(res, error);
  }
};
var updateAnIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const result = await issueService.updateIssueToDB(
      id,
      user,
      req.body
    );
    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    serverError(res, error);
  }
};
var deleteAnIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.deleteIssueFromDB(id);
    if (!result) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    serverError(res, error);
  }
};
var issueController = {
  createAnIssue,
  getAllIssues,
  getSingleIssue,
  updateAnIssue,
  deleteAnIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var AUTH_ERRORS = {
  EMPTY_TOKEN: {
    success: false,
    statusCode: 401,
    message: "Authorization token is required."
  },
  INVALID_TOKEN: {
    success: false,
    statusCode: 401,
    message: "Invalid or expired authorization token."
  },
  INVALID_USER: {
    success: false,
    statusCode: 404,
    message: "User does not exist."
  },
  ROLE_NOT_ALLOWED: {
    success: false,
    statusCode: 403,
    message: "You are not authorized to perform this action."
  }
};
var authMiddleware = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse(res, AUTH_ERRORS["EMPTY_TOKEN"]);
      }
      const decodedToken = jwt2.verify(token, config_default.secret);
      const result = await pool.query(
        `
        SELECT * FROM users
        WHERE id=$1
        `,
        [decodedToken.id]
      );
      if (result.rows.length === 0) {
        return sendResponse(res, AUTH_ERRORS["INVALID_USER"]);
      }
      const user = result.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse(res, AUTH_ERRORS["ROLE_NOT_ALLOWED"]);
      }
      req.user = decodedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = authMiddleware;

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default("maintainer" /* MAINTAINER */, "contributor" /* CONTRIBUTOR */),
  issueController.createAnIssue
);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default("maintainer" /* MAINTAINER */, "contributor" /* CONTRIBUTOR */),
  issueController.updateAnIssue
);
router2.delete(
  "/:id",
  auth_default("maintainer" /* MAINTAINER */),
  issueController.deleteAnIssue
);
var issueRouter = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};

// src/app.ts
var app = express();
app.use(cookieParser());
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000"
  })
);
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.use(globalErrorHandler);
var app_default = app;

// src/server.ts
var port = config_default.port;
var main = () => {
  initDB();
  app_default.listen(port, () => {
    console.log(`The Application is running on port: ${port}`);
  });
};
main();
//# sourceMappingURL=server.js.map