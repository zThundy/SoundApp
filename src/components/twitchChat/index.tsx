import { useContext, useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';

import style from "./events.module.css";
import { styled } from '@mui/system';
import { TranslationContext } from '@/i18n/TranslationProvider';

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

const StyledStack = styled(Stack)(({ theme }) => ({
  maxHeight: 'calc(100vh - 15rem)',
  overflow: 'auto',
  backgroundColor: (theme.palette as any).background["850"],
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
}));

export default function TwitchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { t } = useContext(TranslationContext)

  useEffect(() => {
    // Carica la cache all'avvio
    const loadCache = async () => {
      try {
        let { messages } = await window.twitchEvents.getCachedMessages();
        const { redemptions } = await window.twitchEvents.getCachedRedemptions();

        // sort messages by timestamp descending
        messages = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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

  // sort messages by timestamp descending
  useEffect(() => {
    setMessages(prev => [...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, [messages]);

  return (
    <Grid container spacing={2} className={style.container} padding={2}>
      <Grid size={{ lg: 12, md: 12 }}>
        <StyledStack direction="row" spacing={2} alignItems={"center"} justifyContent={"space-beetween"} display={"flex"}>
          <Typography variant="h6" width={"100%"} pl={3} pt={1} pb={1}>
            {t("twitchChat.status")}
          </Typography>
          <Typography variant="h6" width={"100%"} textAlign={"right"} pr={3} pt={1} pb={1}>
            {isConnected ? t("twitchChat.connected") : t("twitchChat.disconnected")}
          </Typography>
        </StyledStack>
      </Grid>

      <Grid size={{ lg: 6, md: 6 }}>
        <Typography variant="h6" gutterBottom>
          {t("twitchChat.recentRedeems")}
        </Typography>
        <StyledStack>
          <List>
            {redemptions.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("twitchChat.noRedeemsYet")}
              </Typography>
            ) : (
              redemptions.map((redemption) => (
                <ListItem key={redemption.id} className={style.listItem}>
                  <ListItemText
                    primary={
                      <Grid container direction="row" spacing={1} alignItems={"flex-start"} flexWrap={"wrap"}>
                        <Grid size={{ lg: 6, md: 6 }}>
                          <Typography variant="body1">
                            {redemption.userDisplayName}
                          </Typography>
                        </Grid>
                        <Grid size={{ lg: 6, md: 6 }} display="flex" gap={1} flexWrap={"wrap"} justifyContent={"flex-end"}>
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
                        </Grid>
                      </Grid>
                    }
                    secondary={
                      <>
                        {redemption.userInput && (
                          <Typography variant="body2">
                            {t("twitchChat.userInput", { input: redemption.userInput })}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {t("twitchChat.redeemedAt", { time: new Date(redemption.timestamp).toLocaleDateString() + ' ' + new Date(redemption.timestamp).toLocaleTimeString() })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </StyledStack>
      </Grid>

      <Grid size={{ lg: 6, md: 6 }}>
        <Typography variant="h6" gutterBottom>
          {t("twitchChat.recentMessages")}
        </Typography>
        <StyledStack>
          <List>
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("twitchChat.noMessagesYet")}
              </Typography>
            ) : (
              messages.map((msg, index) => (
                <ListItem key={`${msg.userId}-${index}`} className={style.listItem}>
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
        </StyledStack>
      </Grid>
    </Grid>
  );
}
