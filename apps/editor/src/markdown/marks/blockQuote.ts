import { DOMOutputSpecArray, ProsemirrorNode } from 'prosemirror-model';
import { Command } from 'prosemirror-commands';
import { EditorCommand } from '@t/spec';
import { clsWithMdPrefix } from '@/utils/dom';
import Mark from '@/spec/mark';
import {
  createParagraph,
  createTextSelection,
  insertNodes,
  replaceNodes,
} from '@/helper/manipulation';
import { getExtendedRangeOffset, resolveSelectionPos } from '../helper/pos';

export const reBlockQuote = /^\s*> ?/;

export class BlockQuote extends Mark {
  get name() {
    return 'blockQuote';
  }

  get defaultSchema() {
    return {
      toDOM(): DOMOutputSpecArray {
        return ['span', { class: clsWithMdPrefix('block-quote') }, 0];
      },
    };
  }

  private getChangedText(text: string, isBlockQuote?: boolean) {
    if (isBlockQuote) {
      return text.replace(reBlockQuote, '').trim();
    }
    return text.trim() ? `> ${text.trim()}` : `> `;
  }

  private extendBlockQuote(): Command {
    return ({ selection, doc, tr, schema }, dispatch) => {
      const [, to] = resolveSelectionPos(selection);
      const startResolvedPos = doc.resolve(to);

      const lineText = startResolvedPos.node().textContent;
      const isBlockQuote = reBlockQuote.test(lineText);

      const [startOffset, endOffset] = getExtendedRangeOffset(to, to, doc);

      if (isBlockQuote) {
        const isEmpty = !lineText.replace(reBlockQuote, '').trim();

        if (isEmpty) {
          const emptyNode = createParagraph(schema);

          dispatch!(replaceNodes(tr, startOffset, endOffset, [emptyNode, emptyNode]));
        } else {
          const slicedText = lineText.slice(to - startOffset).trim();
          const node = createParagraph(schema, this.getChangedText(slicedText));
          const newTr = slicedText
            ? replaceNodes(tr, to, endOffset, node, { from: 0, to: 1 })
            : insertNodes(tr, endOffset, node);
          const newSelection = createTextSelection(newTr, to + slicedText.length + 4);

          dispatch!(newTr.setSelection(newSelection));
        }

        return true;
      }

      return false;
    };
  }

  commands(): EditorCommand {
    return () => ({ selection, doc, tr, schema }, dispatch) => {
      const [from, to] = resolveSelectionPos(selection);
      const [startOffset, endOffset] = getExtendedRangeOffset(from, to, doc);
      const startResolvedPos = doc.resolve(from);

      const lineText = startResolvedPos.node().textContent;
      const isBlockQuote = reBlockQuote.test(lineText);

      const nodes: ProsemirrorNode[] = [];

      doc.nodesBetween(startOffset, endOffset, (node) => {
        const { isBlock, textContent } = node;

        if (isBlock) {
          const result = this.getChangedText(textContent, isBlockQuote);

          nodes.push(createParagraph(schema, result));
        }
      });

      if (nodes.length) {
        dispatch!(replaceNodes(tr, startOffset, endOffset, nodes));
        return true;
      }

      return false;
    };
  }

  keymaps() {
    const blockQuoteCommand = this.commands()();

    return {
      'alt-q': blockQuoteCommand,
      'alt-Q': blockQuoteCommand,
      Enter: this.extendBlockQuote(),
    };
  }
}