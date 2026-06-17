import { Box, Text, Flex, Badge } from '@chakra-ui/react';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Message } from '@/services/websocket-service';

// Type definitions
interface ChatBubbleProps {
  message: Message;
  isSelected?: boolean;
  onClick?: () => void;
}

// Predefined agent colors for visual differentiation
const AGENT_COLORS: Record<string, { bg: string; badge: string; label: string }> = {
  HomeAITuber: { bg: 'blue.500', badge: 'blue', label: '🎤 Main' },
};

// Hash a name to pick from a palette
const NAME_PALETTE = [
  { bg: 'teal.500', badge: 'teal', label: '🎙️' },
  { bg: 'purple.500', badge: 'purple', label: '🎙️' },
  { bg: 'orange.500', badge: 'orange', label: '🎙️' },
  { bg: 'pink.500', badge: 'pink', label: '🎙️' },
  { bg: 'cyan.500', badge: 'cyan', label: '🎙️' },
  { bg: 'yellow.600', badge: 'yellow', label: '🎙️' },
];

function getAgentStyle(name: string | undefined): { bg: string; badge: string; label: string } {
  if (!name) return { bg: 'blue.500', badge: 'blue', label: '🤖' };
  if (AGENT_COLORS[name]) return AGENT_COLORS[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % NAME_PALETTE.length;
  return {
    ...NAME_PALETTE[idx],
    label: '🎙️',
  };
}

// Main component
export function ChatBubble({ message, isSelected, onClick }: ChatBubbleProps): JSX.Element {
  const isAI = message.role === 'ai';
  const agentStyle = getAgentStyle(message.name);

  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      bg={isSelected ? 'gray.100' : 'transparent'}
      _hover={{ bg: 'gray.50' }}
      p={2}
      borderRadius="md"
      transition="background-color 0.2s"
    >
      <Flex gap={3}>
        <AvatarGroup>
          <Avatar
            size="sm"
            name={message.name || (isAI ? 'AI' : 'Me')}
            bg={isAI ? agentStyle.bg : 'green.500'}
            color="white"
          />
        </AvatarGroup>
        <Box flex={1}>
          <Flex align="center" gap={2}>
            <Text fontSize="sm" fontWeight="bold" color="gray.700">
              {message.name || (isAI ? 'AI' : 'Me')}
            </Text>
            {isAI && message.name && (
              <Badge size="xs" variant="subtle" colorPalette={agentStyle.badge}>
                {agentStyle.label}
              </Badge>
            )}
          </Flex>
          <Text
            fontSize="sm"
            color="gray.600"
            truncate
          >
            {message.content}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
