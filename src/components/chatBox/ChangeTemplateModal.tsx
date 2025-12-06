import React, { useContext } from 'react';
import { TranslationContext } from '@/i18n/TranslationProvider';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, styled, Box } from '@mui/material';

interface ChangeTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  templateName: string | undefined;
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
    maxWidth: "60%",
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

const ChangeTemplateModal: React.FC<ChangeTemplateModalProps> = ({ isOpen, onClose, onConfirm, templateName }) => {
  const { t } = useContext(TranslationContext);

  return (
    <StyledDialog
      open={isOpen}
      onClose={onClose}
    >
      <StyledBox>
        <DialogTitle>{t('chatBox.changeTemplateTitle')}</DialogTitle>
      </StyledBox>
      <DialogContent>
        <Typography>
          {t('chatBox.changeTemplateConfirmation', { templateName })}
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
          variant='contained'
          color="primary"
          fullWidth
        >
          {t('common.confirm')}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
}

export default ChangeTemplateModal;
