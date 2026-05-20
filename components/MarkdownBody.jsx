import * as React from 'react';
import Markdown from 'react-native-markdown-display';

const styles = {
  body: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#000000',
  },
  heading1: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 17,
    marginBottom: 6,
    marginTop: 12,
    color: '#000000',
  },
  heading2: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 15,
    marginBottom: 4,
    marginTop: 10,
    color: '#000000',
  },
  heading3: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 8,
    color: '#000000',
  },
  code_inline: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 12,
    lineHeight: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 0,
    color: '#000000',
  },
  fence: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.06)',
    padding: 8,
    borderRadius: 2,
    color: '#000000',
    marginVertical: 6,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0,0,0,0.20)',
    paddingLeft: 10,
    marginLeft: 0,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginVertical: 4,
  },
  link: {
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  strong: {
    fontFamily: 'JetBrainsMono_700Bold',
  },
  bullet_list_icon: {
    marginTop: 6,
    color: 'rgba(0,0,0,0.60)',
  },
  ordered_list_icon: {
    fontFamily: 'JetBrainsMono_400Regular',
    color: 'rgba(0,0,0,0.60)',
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    marginVertical: 8,
  },
  th: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 6,
  },
  td: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 11,
    padding: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.10)',
  },
  hr: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    height: 1,
    marginVertical: 12,
  },
};

export function MarkdownBody({ children }) {
  if (!children) return null;
  return <Markdown style={styles}>{children}</Markdown>;
}
