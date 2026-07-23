/** Execute a single CURL request via the agent server. Returns { status, headers, body }. */
declare function requestCURL(curlString: string): Promise<{ status: number; headers: Record<string, string>; body: any }>;

/** Send an HTTP request with explicit parameters. Returns { status, headers, body }. */
declare function request(options: { method: string; url: string; headers?: Record<string, string> | string; body?: string | object | null }): Promise<{ status: number; headers: Record<string, string>; body: any }>;

/** Parse the body of a response as JSON. Returns the parsed object, or the raw string if parsing fails. */
declare function parseResponse(response: { status: number; headers: Record<string, string>; body: any }): any;

/** Parse an array of responses as JSON in one call. Returns array of parsed bodies. */
declare function parseResponseMulti(responses: Array<{ status: number; headers: Record<string, string>; body: any }>): any[];

/** Send multiple HTTP requests in parallel. Preserves input order. Returns array of { status, headers, body }. */
declare function requestMulti(requests: Array<{ method: string; url: string; headers?: Record<string, string> | string; body?: string | object | null }>): Promise<Array<{ status: number; headers: Record<string, string>; body: any }>>;

/** Send multiple CURL requests in parallel. Preserves input order. Returns array of { status, headers, body }. */
declare function requestMultiCURL(curlStrings: string[]): Promise<Array<{ status: number; headers: Record<string, string>; body: any }>>;

/** Read the content of a local file via the agent server. Returns file content as string. */
declare function readFile(filePath: string): Promise<string>;

/** Read all text files in a folder via the agent server. Returns array of { name, content }. */
declare function readFolder(folderPath: string): Promise<Array<{ name: string; content: string }>>;

/** Convert JSON data to PostgreSQL INSERT scripts. Returns a complete SQL string. */
declare function convertJSONToPostgreSQL(data: any | any[], config: { tableName: string; schemaName?: string; primaryKeyField?: string; enableCreateTable?: boolean; enableDeleteScript?: boolean }): string;

/** Convert a request object to CURL command text. Returns the CURL string. */
declare function stringifyCURL(request: { apiUrl: string; httpMethod?: string; headersText?: string; bodyText?: string }): string;

/** Build mock API response objects from request/response pairs. Returns array of mock objects. */
declare function createMockResponse(items: { request: any; response: { status: number; headers: Record<string, string>; body: any } } | Array<{ request: any; response: { status: number; headers: Record<string, string>; body: any } }>, options?: { group_id?: string; request_name?: string }): any[];

/** Wait for a specified amount of time. Takes seconds. */
declare function delay(seconds: number): Promise<void>;

/** Execute a function with automatic retry on failure. Returns the result on success, or throws the last error. */
declare function retry<T>(fn: () => T | Promise<T>, options?: { attempts?: number; delaySec?: number; shouldRetry?: (error: any) => boolean }): Promise<T>;
