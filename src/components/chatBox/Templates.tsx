
import { useContext } from 'react';
import { Typography } from '@mui/material';
import { TranslationContext } from '@/i18n/TranslationProvider';

const Templates = () => {
  const { t } = useContext(TranslationContext);

  return (
    <Typography>{t("chatBox.templatesComingSoon")}</Typography>
  )
}

export default Templates;