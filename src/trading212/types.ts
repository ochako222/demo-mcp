// Trading 212 API Types

export interface Portfolio {
	cash: number
	invested: number
	result: number
	resultCoef: number
	total: number
	positions: Position[]
}

export interface Position {
	positionId: string
	ticker: string
	quantity: number
	averagePrice: number
	currentPrice: number
	value: number
	ppl: number
	frontend: string
	maxBuy?: number
	maxSell?: number
	pieQuantity?: number
}

export interface AccountCash {
	free: number
	total: number
	ppl: number
	result: number
	invested: number
	blockedForStocks: number
	pieCash: number
}

export interface Order {
	dateCreated: string
	dateExecuted: string
	dateModified: string
	executor: string
	fillCost: number
	fillId: number
	fillPrice: number
	fillResult: number
	fillType: string
	filled: boolean
	id: number
	limitPrice?: number
	orderedQuantity: number
	orderedValue: number
	parentOrder?: number
	status: string
	stopPrice?: number
	strategy: string
	ticker: string
	timeValidity: string
	type: string
	userId: number
}

export interface AccountMetadata {
	currencyCode: string
	id: number
}

export interface Trading212ApiError {
	message: string
	code?: string
	status?: number
}
