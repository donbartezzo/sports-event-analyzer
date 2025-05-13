# REST API Plan

## 1. Resources

- **Users**: Represents user accounts managed by Supabase Auth. This table contains user details and authentication metadata.
- **Analysis**: Stores analysis data. Each analysis record is linked to a user and includes flexible JSONB fields for dynamic data storage.
- **Analysis Logs**: Contains logs specific to each analysis. These logs maintain context and step-by-step details of each analysis process.
- **Analysis Types**: Defines different types of analyses available. This resource helps in categorizing and enforcing validations on analysis data.
- **Logs**: General system logs for recording events and errors within the application.

## 2. Endpoints

For each resource, CRUD endpoints are defined along with additional endpoints to support business logic. All endpoints support pagination, filtering, and sorting where applicable.

### Users

- **GET /users**
  - **Description**: Retrieve a paginated list of users.
  - **Query Parameters**: `page`, `limit`, `sort` (e.g. by creation date)
  - **Response**: JSON array of user objects with status code 200.
  - **Errors**: 401 Unauthorized (if token missing or invalid).

- **GET /users/{id}**
  - **Description**: Retrieve details for a specific user.
  - **Response**: JSON object representing the user with status code 200.
  - **Errors**: 404 Not Found, 401 Unauthorized

### Analysis

- **GET /analysis**
  - **Description**: Retrieve a list of analysis records.
  - **Query Parameters**: `page`, `limit`, `sort`, and filters (e.g. by user_id or analysis_type_id)
  - **Response**: JSON array of analysis records with status code 200.

- **GET /analysis/{id}**
  - **Description**: Retrieve detailed analysis information by its ID.
  - **Response**: JSON object with analysis data.
  - **Errors**: 404 Not Found, 401 Unauthorized

- **POST /analysis**
  - **Description**: Create a new analysis record.
  - **Request Payload**:
    ```json
    {
      "user_id": "string",
      "analysis_type_id": 1,  // flexible JSONB payload
      "parameters": { "key": "value" }  
    }
    ```
  - **Response**: JSON object of the created analysis record with status code 201.
  - **Errors**: 400 Bad Request, 401 Unauthorized

- **PUT /analysis/{id}**
  - **Description**: Update an existing analysis record.
  - **Request Payload**: Partial or full update JSON schema.
  - **Response**: JSON object representing the updated record (status 200).
  - **Errors**: 400 Bad Request, 404 Not Found, 401 Unauthorized

- **DELETE /analysis/{id}**
  - **Description**: Delete an analysis record.
  - **Response**: Status code 204 on success.
  - **Errors**: 404 Not Found, 401 Unauthorized

### Analysis Logs

- **GET /analysis/{analysis_id}/logs**
  - **Description**: Retrieve logs for a specific analysis.
  - **Query Parameters**: `page`, `limit`
  - **Response**: JSON array of log objects.

- **POST /analysis/{analysis_id}/logs**
  - **Description**: Create a new log entry for an analysis.
  - **Request Payload**:
    ```json
    {
      "message": "string",
      "timestamp": "ISO8601 string",
      "level": "info | warning | error"
    }
    ```
  - **Response**: JSON object of the created log with status 201.

- **PUT /analysis/{analysis_id}/logs/{log_id}**
  - **Description**: Update an existing log entry.
  - **Response**: JSON object of the updated log with status code 200.

- **DELETE /analysis/{analysis_id}/logs/{log_id}**
  - **Description**: Delete a log entry.
  - **Response**: Status code 204 on success.

### Analysis Types

- **GET /analysis-types**
  - **Description**: Retrieve a list of analysis types.
  - **Response**: JSON array of analysis type objects.

- **GET /analysis-types/{id}**
  - **Description**: Retrieve details for a specific analysis type.
  - **Response**: JSON object with the analysis type details.

### Logs (System Logs)

- **GET /logs**
  - **Description**: Retrieve system logs.
  - **Query Parameters**: `page`, `limit`, `sort`, `level` filter
  - **Response**: JSON array of log objects.

- **POST /logs**
  - **Description**: Create a new system log entry (this endpoint may be restricted to internal services).
  - **Request Payload**:
    ```json
    {
      "message": "string",
      "timestamp": "ISO8601 string",
      "level": "info | warning | error",
      "meta": { "key": "value" }
    }
    ```
  - **Response**: JSON object of the created log entry with status 201.

## 3. Authentication and Authorization

- **Mechanism**: The API will use JWT Bearer tokens as issued by Supabase Auth. Each request must include the token in the `Authorization` header.
- **RLS and Policies**: Database Row-Level Security (RLS) is enabled for all tables. Each endpoint will enforce policies to ensure that a user only accesses their own records as defined in the schema. Separate policies are implemented for select, insert, update, and delete operations for anonymous and authenticated users.

## 4. Validation and Business Logic

- **Validation Rules**:
  - Ensure required fields are provided in each POST/PUT request (e.g., `user_id`, `analysis_type_id` for the analysis resource).
  - Validate JSONB payload formats for flexibility while ensuring schema consistency where possible.
  - Foreign key references (e.g., ensuring that an `analysis_type_id` exists in the analysis types table) are enforced.
  - Input data for logs must follow allowed levels (`info`, `warning`, `error`).

- **Business Logic Implementation**:
  - **Users**: Although user management is largely handled by Supabase Auth, the API can extend user profile functionalities if needed.
  - **Analysis**: The creation and update of analysis records may trigger additional workflows (e.g., starting an analysis process, triggering asynchronous tasks) which will be handled by backend services.
  - **Analysis Logs**: Tied directly to an analysis record, logs are automatically appended and may trigger notifications or alerts if error-level logs are recorded.
  - **Analysis Types**: Provides a controlled list of analysis categories. Changes to this resource affect validation rules in the analysis endpoints.
  - **Logs**: System logs are recorded either through the API or separately by internal services. Rate limiting and logging are applied to avoid abuse.

- **Pagination, Filtering, and Sorting**:
  - All list endpoints support `page`, `limit`, and `sort` query parameters to handle large data volumes efficiently.
  - Filtering options are provided on key fields such as `user_id`, `analysis_type_id`, and `timestamp` where applicable.

- **Performance and Security Considerations**:
  - Use of proper indexing on foreign keys and frequently queried columns as indicated in the database schema.
  - Enable RLS for fine-grained security control on all operations.
  - Input validations and error handling are implemented at the API level.
  - Rate limiting and throttling may be employed at the gateway level to prevent abuse.

---

**Assumptions**:
- Supabase Auth is used for user authentication and will handle session management and token issuance.
- The API is designed to interface with PostgreSQL as managed by Supabase. Adaptations may be necessary for other database systems.
- Business logic beyond CRUD (e.g., asynchronous processing of analysis) is handled by background services triggered by API events.

This plan maps closely to the provided database schema, PRD, and tech stack requirements (Astro, TypeScript, React, Tailwind, and Shadcn/ui) by segregating the responsibilities clearly into resources, endpoints, and security layers.
