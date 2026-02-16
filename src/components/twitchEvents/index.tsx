import { useContext, useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Stack,
  Box
} from '@mui/material';

import style from "./events.module.css";
import { height, styled } from '@mui/system';

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
  messageFragment?: any[];
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
  message?: string;
  tier?: string;
  type?: string;
  bits?: string;
  total_months?: string;
  streak_months?: string;
  cumulative_months?: string;
  total?: string;
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
  const [events, setEvents] = useState<RewardRedemption[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { t } = useContext(TranslationContext)
  const { error } = useContext(NotificationContext)

  useEffect(() => {
    const loadCache = async () => {
      try {
        let { messages } = await window.twitchEvents.getCachedMessages();
        const { redemptions } = await window.twitchEvents.getCachedRedemptions();

        messages = messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        let redeems = redemptions.filter(r => (r as any).type === "reward")
        let events = redemptions.filter(r => (r as any).type === "follow" || (r as any).type === "subscriber" || (r as any).type === "bits")
        console.log(events)

        setMessages(messages);
        setMessagesToDisplay(messages ? messages.slice(0, 50) : []);
        setRedemptions(redemptions ? redeems.slice(0, 10) : []);
        setEvents(redemptions ? events.slice(0, 10) : []);
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
      setMessagesToDisplay(prev => [message, ...prev].slice(0, 50));
    });

    window.twitchEvents.onRewardRedeemed((event: RewardRedemption) => {
      switch(event.type) {
        case "reward":
          setRedemptions(prev => [event, ...prev].slice(0, 10));
          break;
        case "follow":
        case "subscriber":
        case "bits":
          setEvents(prev => [event, ...prev].slice(0, 10));
          break;
      }
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

      <Grid container spacing={2} padding={2} justifyContent={"center"} alignContent={"center"}>
        <Grid size={{ lg: 12, md: 12 }}>
          <Typography variant="h6" gutterBottom>
            {t("twitchChat.recentRedeems")}
          </Typography>
          <StyledStack>
            <List>
              {redemptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ paddingLeft: "1rem" }}>
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

        <Grid size={{ lg: 12, md: 12 }}>
          <Typography variant="h6" gutterBottom>
            {t("twitchChat.recentEvents")}
          </Typography>
          <StyledStack>
            <List>
              {events.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ paddingLeft: "1rem" }}>
                  {t("twitchChat.noEventsYet")}
                </Typography>
              ) : (
                events.map((event, index) => (
                  <ListItem key={index} className={style.listItem}>
                    <ListItemText
                      primary={
                        <Grid container direction="row" spacing={1} alignItems={"flex-start"} flexWrap={"wrap"}>
                          <Grid size={{ lg: 6, md: 6 }}>
                            <Typography variant="body1">
                              {event.userDisplayName}
                            </Typography>
                          </Grid>
                          <Grid size={{ lg: 6, md: 6 }} display="flex" gap={1} flexWrap={"wrap"} justifyContent={"flex-end"}>
                            <Chip
                              label={event.type}
                              size="small"
                              color="primary"
                            />
                          </Grid>
                        </Grid>
                      }
                      secondary={
                        <>
                          {event.message && (
                            <Typography variant="body2">
                              {t("twitchChat.userInput", { input: event.message })}
                            </Typography>
                          )}
                          {event.tier && (
                            <Typography variant="body2">
                              {t("twitchChat.tier", { tier: event.tier })}
                            </Typography>
                          )}
                          {event.total && (
                            <Typography variant="body2">
                              {t("twitchChat.total", { months: event.total })}
                            </Typography>
                          )}
                          {event.cumulative_months && (
                            <Typography variant="body2">
                              {t("twitchChat.cumulativeTotalGifted", { months: event.cumulative_months })}
                            </Typography>
                          )}
                          {event.total_months && (
                            <Typography variant="body2">
                              {t("twitchChat.totalMonths", { months: event.total_months })}
                            </Typography>
                          )}
                          {event.streak_months && (
                            <Typography variant="body2">
                              {t("twitchChat.streakMonths", { months: event.streak_months })}
                            </Typography>
                          )}
                          {event.bits && (
                            <Typography variant="body2">
                              {t("twitchChat.bitsAmount", { bits: event.bits })}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {t("twitchChat.recordedAt", { time: new Date(event.timestamp).toLocaleDateString() + ' ' + new Date(event.timestamp).toLocaleTimeString() })}
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

        <Grid size={{ lg: 12, md: 12 }}>
          <Typography variant="h6" gutterBottom>
            {t("twitchChat.recentMessages")}
          </Typography>
          <StyledStack>
            <List>
              {messagesToDisplay.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ paddingLeft: "1rem" }}>
                  {t("twitchChat.noMessagesYet")}
                </Typography>
              ) : (
                messagesToDisplay.map((msg, index) => (
                  <ListItem key={`${msg.userId}-${index}`} className={style.listItem}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={0.5} alignItems={"center"} justifyContent={"flex-start"} flexWrap="wrap">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ color: msg.color || 'inherit' }}
                          >
                            {msg.displayName}:
                          </Typography>
                          {
                            msg.messageFragment?.map((fragment, index) => (
                              <Stack key={index} direction="row" alignItems={"flex-start"} justifyContent={"flex-start"} display={"flex"}>
                                {fragment.type === "emote" ?
                                    <img src={fragment.emoteUrl} style={{ width: "30px", height: "30px" }} /> 
                                  : null}
                                {fragment.type === "text" ?
                                  <Typography variant="body2">
                                    {fragment.text}
                                  </Typography> : null}
                              </Stack>
                            ))
                          }
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
    </Grid>
  );
}
