


import React, { useContext } from 'react';
import { TranslationContext } from '@/i18n/TranslationProvider';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, styled, Box } from '@mui/material';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  rewardTitle: string;
}

const StyledBox = styled(Box)(({ theme }) => ({
  backgroundColor: (theme.palette as any).background["800"],
  padding: theme.spacing(.5),
  borderRadius: theme.shape.borderRadius,
  justifyContent: "space-between",
  alignContent: "center",
  alignItems: "center",
  display: "flex",
  flexDirection: "row",
  width: "calc(100% - 8px)",
  transition: "background-color .2s ease-in-out",
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  alignItems: 'center',

  '& .MuiPaper-root': {
    maxWidth: "100%",
    padding: theme.spacing(2),
    backgroundColor: (theme.palette as any).background["850"],
    color: (theme.palette as any).text.primary,
    backgroundImage: 'none',
  },

  // dialog title
  '& .MuiDialogTitle-root': {
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
}));

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, rewardTitle }) => {
  const { t } = useContext(TranslationContext);

  return (
    <StyledDialog
      open={isOpen}
      onClose={onClose}
    >
      <StyledBox>
        <DialogTitle>{t('redeems.deleteRewardTitle')}</DialogTitle>
      </StyledBox>
      <DialogContent>
        <Typography>
          {t('redeems.deleteRewardConfirmation', { rewardTitle })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          variant='outlined'
          fullWidth
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          // color="secondary"
          variant='contained'
          color="error"
          fullWidth
        >
          {t('common.delete')}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default DeleteModal;