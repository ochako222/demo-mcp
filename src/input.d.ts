declare module "input" {
	interface InputMethods {
		text(prompt: string): Promise<string>
		select(prompt: string, options: string[]): Promise<string>
		confirm(prompt: string): Promise<boolean>
	}

	const input: InputMethods
	export default input
}
