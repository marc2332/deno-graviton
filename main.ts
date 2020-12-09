export async function entry({ RunningConfig }) {
	RunningConfig.emit('registerLanguageServer', {
		modes: ['javascript', 'typescript'],
		args: ['deno', 'lsp'],
	})
}