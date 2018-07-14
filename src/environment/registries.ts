import { CommandRegistry } from '../client/features/commands'
import { TextDocumentDecorationsProviderRegistry } from './providers/decoration'
import { TextDocumentHoverProviderRegistry } from './providers/hover'

/** Registries is a container for all provider registries. */
export class Registries {
    public readonly commands = new CommandRegistry()
    public readonly textDocumentHover = new TextDocumentHoverProviderRegistry()
    public readonly textDocumentDecorations = new TextDocumentDecorationsProviderRegistry()
}
