import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { spacing, MAX_FONT_SCALE } from '../../styles/tokens';

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] };

function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  source
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        return;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushParagraph();
        blocks.push({
          kind: 'heading',
          level: heading[1].length,
          text: heading[2].trim(),
        });
        return;
      }

      const unordered = trimmed.match(/^[-*]\s+(.*)$/);
      const ordered = trimmed.match(/^\d+\.\s+(.*)$/);
      if (unordered || ordered) {
        flushParagraph();
        const isOrdered = Boolean(ordered);
        const item = (ordered?.[1] ?? unordered?.[1] ?? '').trim();
        const last = blocks[blocks.length - 1];
        if (last && last.kind === 'list' && last.ordered === isOrdered) {
          last.items.push(item);
        } else {
          blocks.push({ kind: 'list', ordered: isOrdered, items: [item] });
        }
        return;
      }

      paragraph.push(trimmed);
    });

  flushParagraph();
  return blocks;
}

function renderInline(text: string, boldStyle: TextStyle) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <Text key={index} style={boldStyle} maxFontSizeMultiplier={MAX_FONT_SCALE}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={index} maxFontSizeMultiplier={MAX_FONT_SCALE}>{part}</Text>;
  });
}

interface MarkdownTextProps {
  content: string;
  textStyle?: TextStyle;
}

export function MarkdownText({ content, textStyle }: MarkdownTextProps) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        heading: { color: colors.fg, fontWeight: '600' },
        heading2: { fontSize: 18, lineHeight: 25, marginTop: spacing.sm, marginBottom: spacing.xs },
        heading3: { fontSize: 16, lineHeight: 22, marginTop: spacing.xs, marginBottom: 2 },
        paragraph: { ...(textStyle ?? {}), color: colors.fg },
        list: { marginBottom: spacing.xs },
        listRow: { flexDirection: 'row', marginBottom: 6 },
        listMarker: { width: 22, color: colors.muted, fontSize: 16, lineHeight: 24 },
        listText: { ...(textStyle ?? {}), color: colors.fg, flex: 1 },
        bold: { fontWeight: '600' },
      }),
    [colors, textStyle]
  );

  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          const headingStyle = block.level <= 2 ? styles.heading2 : styles.heading3;
          return (
            <Text
              key={index}
              style={[styles.heading, headingStyle]}
              maxFontSizeMultiplier={MAX_FONT_SCALE}
            >
              {renderInline(block.text, styles.bold)}
            </Text>
          );
        }

        if (block.kind === 'list') {
          return (
            <View key={index} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.listRow}>
                  <Text style={styles.listMarker} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <Text style={styles.listText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {renderInline(item, styles.bold)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text
            key={index}
            style={[styles.paragraph, index > 0 ? { marginTop: spacing.xs } : null]}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            {renderInline(block.text, styles.bold)}
          </Text>
        );
      })}
    </View>
  );
}
