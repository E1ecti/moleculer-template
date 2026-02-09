type AuthorizationMetadata = {
  user: string
  admin: boolean
}

type ApiGatewayMetadata = {
  /**
   * Set HTTP status response code.
   * For example: 200, 404, 500.
   */
  $statusCode: number

  /**
   * Set HTTP status text message.
   * For example: “OK”, ‘Not Found’, ‘Internal Server Error’.
   */
  $statusMessage: string

  /**
   * Set MIME response type.
   * For example: "application/json", "text/html", "image/png".
   */
  $responseType: string

  /**
   * Set response headers.
   * These are key-value pairs representing HTTP headers to be included in the response.
   */
  $responseHeaders: Record<string, string>

  /**
   * Set URL pointed to by the 'Location' header (if any).
   * Used for redirects (3xx statuses).
   */
  $location: string
}

export type { AuthorizationMetadata, ApiGatewayMetadata }
