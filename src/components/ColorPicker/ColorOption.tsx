import Box from '@mui/material/Box';

export interface ColorOptionProps {
  colorKey: string;
  color: string;
  selected?: Boolean;
  onClick: (color: string) => void;
}

export const ColorOption = (props: ColorOptionProps) => {
  const onClick = () => {
    props.onClick(props.color);
  };

  return (
    <Box
      tabIndex={-1}
      component="div"
      className="color-dot-container"
      sx={{
        outline: 'none',
        cursor: 'pointer',
        position: 'relative',
        width: '18px',
        height: '18px',
        margin: '3px',
        boxSizing: 'border-box',
        borderRadius: '50%',
        backgroundColor: props.color,
        '&:hover': {
          width: '20px',
          height: '20px',
          margin: '2px',
          boxShadow:
            '0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 2px 1px -1px rgb(0 0 0 / 12%), 0px 1px 3px 0px rgb(0 0 0 / 20%)',
        },
      }}
    >
      <Box
        className={'color-dot'}
        component="li"
        aria-label={props.colorKey}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
        }}
        onClick={onClick}
      />
    </Box>
  );
};
