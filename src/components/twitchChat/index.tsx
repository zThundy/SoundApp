import { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, Stack } from '@mui/material';

interface ChatMessage {
  userId: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: Date;
  color?: string;
  badges?: string[];
}

interface RewardRedemption {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  rewardId: string;
  rewardTitle: string;
  rewardCost: number;
  userInput?: string;
  timestamp: Date;
  status: 'unfulfilled' | 'fulfilled' | 'canceled';
}

export default function TwitchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Carica la cache all'avvio
    const loadCache = async () => {
      try {
        const { messages } = await window.twitchEvents.getCachedMessages();
        const { redemptions } = await window.twitchEvents.getCachedRedemptions();
        
        setMessages(messages || []);
        setRedemptions(redemptions || []);
        console.log(`Loaded ${messages?.length || 0} cached messages and ${redemptions?.length || 0} cached redemptions`);
      } catch (error) {
        console.error('Error loading cache:', error);
      }
    };

    loadCache();

    // Verifica se è già connesso (connessione automatica al login)
    const checkConnection = async () => {
      try {
        const { connected } = await window.twitchEvents.isConnected();
        setIsConnected(connected);
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();

    // Ascolta i messaggi della chat
    window.twitchEvents.onChatMessage((message: ChatMessage) => {
      setMessages(prev => [...prev, message].slice(-50)); // Mantieni solo gli ultimi 50 messaggi
    });

    // Ascolta i redeem
    window.twitchEvents.onRewardRedeemed((redemption: RewardRedemption) => {
      setRedemptions(prev => [redemption, ...prev].slice(0, 20)); // Mantieni solo gli ultimi 20 redeem
    });

    // Cleanup alla chiusura
    return () => {
      window.twitchEvents.removeChatMessageListener();
      window.twitchEvents.removeRewardRedeemedListener();
      // Non disconnettere qui, la connessione persiste
    };
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Status */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">
            Stato: {isConnected ? '🟢 Connesso' : '🔴 Disconnesso'}
          </Typography>
        </Paper>

        {/* Redemptions */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Redeem Recenti
          </Typography>
          <List>
            {redemptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nessun redeem ancora...
              </Typography>
            ) : (
              redemptions.map((redemption) => (
                <ListItem key={redemption.id}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1">
                          {redemption.userDisplayName}
                        </Typography>
                        <Chip
                          label={redemption.rewardTitle}
                          size="small"
                          color="primary"
                        />
                        <Chip
                          label={`${redemption.rewardCost} punti`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <>
                        {redemption.userInput && (
                          <Typography variant="body2">
                            Input: {redemption.userInput}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(redemption.timestamp).toLocaleTimeString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>

        {/* Chat Messages */}
        <Paper sx={{ p: 2, maxHeight: '400px', overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Chat
          </Typography>
          <List>
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nessun messaggio ancora...
              </Typography>
            ) : (
              messages.map((msg, index) => (
                <ListItem key={`${msg.userId}-${index}`}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ color: msg.color || 'inherit' }}
                        >
                          {msg.displayName}:
                        </Typography>
                        <Typography variant="body2">
                          {msg.message}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      </Stack>
    </Box>
  );
}
