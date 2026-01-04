import { useContext, useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack
} from '@mui/material';

import style from "./events.module.css";
import { styled } from '@mui/system';

import { TranslationContext } from '@/i18n/TranslationProvider';
import { NotificationContext } from '@/context/NotificationProvider';

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

const ConnectedDiv = ({ isConnected }: { isConnected: boolean }) => {
  const { t } = useContext(TranslationContext)

  if (isConnected) {
    return (
      <Stack direction="row" spacing={2} alignItems="center" width={"100%"} justifyContent={"flex-end"} pr={2} pt={1} pb={1}>
        <div className={style.connectedDot} />
        <Typography variant="h6">
          {t("twitchChat.connected")}
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack direction="row" spacing={2} alignItems="center" width={"100%"} justifyContent={"flex-end"} pr={2} pt={1} pb={1}>
      <div className={style.disconnectedDot} />
      <Typography variant="h6">
        {t("twitchChat.disconnected")}
      </Typography>
    </Stack>
  )
}

export default function TwitchChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesToDisplay, setMessagesToDisplay] = useState<ChatMessage[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { t } = useContext(TranslationContext)
  const { error } = useContext(NotificationContext)

  useEffect(() => {
    const loadCache = async () => {
      try {
        let { messages } = await window.twitchEvents.getCachedMessages();
        const { redemptions } = await window.twitchEvents.getCachedRedemptions();

        messages = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setMessages(messages);
        setMessagesToDisplay(messages ? messages.slice(0, 10) : []);
        setRedemptions(redemptions ? redemptions.slice(0, 10) : []);
        console.log(`Loaded ${messages?.length || 0} cached messages and ${redemptions?.length || 0} cached redemptions`);
      } catch (e: any) {
        error(t("twitchChat.loadCacheFailed"), (e as Error).message);
        console.error('Error loading cache:', e);
      }
    };

    loadCache();

    const checkConnection = async () => {
      try {
        const { connected } = await window.twitchEvents.isConnected();
        setIsConnected(connected);
      } catch (e: any) {
        error(t("twitchChat.checkConnectionFailed"), (e as Error).message);
        console.error('Error checking connection:', e);
      }
    };

    checkConnection();

    window.twitchEvents.onChatMessage((message: ChatMessage) => {
      setMessages(prev => [message, ...prev]);
      setMessagesToDisplay(prev => [message, ...prev].slice(0, 10));
    });

    window.twitchEvents.onRewardRedeemed((redemption: RewardRedemption) => {
      setRedemptions(prev => [redemption, ...prev].slice(0, 10));
    });

    return () => {
      window.twitchEvents.removeChatMessageListener();
      window.twitchEvents.removeRewardRedeemedListener();
    };
  }, []);

  useEffect(() => {
    setMessagesToDisplay(prev => [...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }, [messages]);

  return (
    <Grid container spacing={2} className={style.container} padding={2}>
      <Grid size={{ lg: 12, md: 12 }}>
        <StyledStack direction="row" spacing={2} alignItems={"center"} justifyContent={"space-beetween"} display={"flex"}>
          <Typography variant="h6" width={"100%"} pl={3} pt={1} pb={1}>
            {t("twitchChat.status")}
          </Typography>
          <ConnectedDiv isConnected={isConnected} />
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
              redemptions.map((redemption, index) => (
                <ListItem key={index} className={style.listItem}>
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
                            label={t("twitchChat.points", { points: redemption.rewardCost })}
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
            {messagesToDisplay.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("twitchChat.noMessagesYet")}
              </Typography>
            ) : (
              messagesToDisplay.map((msg, index) => (
                <ListItem key={`${msg.userId}-${index}`} className={style.listItem}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems={"flex-start"} justifyContent={"flex-start"}>
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
