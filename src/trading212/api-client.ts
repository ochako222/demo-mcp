import type {
	AccountCash,
	AccountMetadata,
	Order,
	Portfolio,
	Trading212ApiError,
} from "./types.js"

export class Trading212ApiClient {
	private readonly credentials: string

	private readonly baseUrl = "https://live.trading212.com/api/v0"

	constructor(apiKey: string, apiSecret: string) {
		if (!apiKey || !apiSecret) {
			throw new Error("Trading 212 API key is required")
		}

		this.credentials = btoa(`${apiKey}:${apiSecret}`)
	}

	async getPortfolio(): Promise<Portfolio | Trading212ApiError> {
		const response = await fetch(`${this.baseUrl}/equity/portfolio`, {
			method: "GET",
			headers: {
				Authorization: this.credentials,
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			let errorMessage: string

			try {
				const errorJson = JSON.parse(errorText)
				errorMessage = errorJson.message || errorText
			} catch {
				errorMessage = errorText || response.statusText
			}

			return {
				message: `API Error: ${errorMessage}`,
				code: response.status.toString(),
				status: response.status,
			} as Trading212ApiError
		}

		return await response.json()
	}

	async getAccountCash(): Promise<AccountCash | Trading212ApiError> {
		const response = await fetch(`${this.baseUrl}/equity/account/cash`, {
			method: "GET",
			headers: {
				Authorization: this.credentials,
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			let errorMessage: string

			try {
				const errorJson = JSON.parse(errorText)
				errorMessage = errorJson.message || errorText
			} catch {
				errorMessage = errorText || response.statusText
			}

			return {
				message: `API Error: ${errorMessage}`,
				code: response.status.toString(),
				status: response.status,
			} as Trading212ApiError
		}

		return await response.json()
	}

	async getOrdersHistory(params?: {
		cursor?: number
		limit?: number
		ticker?: string
	}): Promise<Order[] | Trading212ApiError> {
		let endpoint = "/equity/history/orders"

		if (params) {
			const queryParams = new URLSearchParams()
			if (params.cursor) queryParams.append("cursor", params.cursor.toString())
			if (params.limit) queryParams.append("limit", params.limit.toString())
			if (params.ticker) queryParams.append("ticker", params.ticker)

			const query = queryParams.toString()
			if (query) endpoint += `?${query}`
		}

		const response = await fetch(`${this.baseUrl}/${endpoint}`, {
			method: "GET",
			headers: {
				Authorization: this.credentials,
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			let errorMessage: string

			try {
				const errorJson = JSON.parse(errorText)
				errorMessage = errorJson.message || errorText
			} catch {
				errorMessage = errorText || response.statusText
			}

			return {
				message: `API Error: ${errorMessage}`,
				code: response.status.toString(),
				status: response.status,
			} as Trading212ApiError
		}

		return await response.json()
	}

	async getAccountMetadata(): Promise<AccountMetadata | Trading212ApiError> {
		const response = await fetch(`${this.baseUrl}/equity/account/info`, {
			method: "GET",
			headers: {
				Authorization: this.credentials,
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			const errorText = await response.text()
			let errorMessage: string

			try {
				const errorJson = JSON.parse(errorText)
				errorMessage = errorJson.message || errorText
			} catch {
				errorMessage = errorText || response.statusText
			}

			return {
				message: `API Error: ${errorMessage}`,
				code: response.status.toString(),
				status: response.status,
			} as Trading212ApiError
		}

		return await response.json()
	}

	// Helper to check if response is an error
	static isError(response: unknown): response is Trading212ApiError {
		return (
			typeof response === "object" &&
			response !== null &&
			"message" in response &&
			typeof (response as Trading212ApiError).message === "string"
		)
	}
}
