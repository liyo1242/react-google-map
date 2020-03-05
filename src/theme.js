// Dark Mode 新增的地方
import React from 'react';
import { ThemeProvider as EmotionThemeProvider } from 'emotion-theming';
import styled from '@emotion/styled'

const white = '#fff';
const black = '#161616';
const gray = '#f8f8f8';

const themeLight = {
	background: gray,
	body: '#cde0c9',
	fontColor: black,
	primary: '#cde0c9',
	primary2: '#68B2a0',
	primary3: '#e0ecde'
}

const themeDark = {
	background: black,
	body: black,
	fontColor: white,
	primary: '#353334',
	primary2: '#8c6e5b',
	primary3: '#e8d6cd'
}

const theme = mode => (mode === 'dark' ? themeDark : themeLight);

const defaultContextData = {
	dark: false,
	toggle: () => {}
};

const ThemeContext = React.createContext(defaultContextData);
const useTheme = () => React.useContext(ThemeContext); // maybe can export ??

const useEffectDarkMode = () => {
	const [themeState, setThemeState] = React.useState({
		dark: false,
		hasThemeMounted: false
	});
	React.useEffect(() => {
		const isDark = localStorage.getItem('dark') === "true";
		setThemeState({...themeState, dark: isDark, hasThemeMounted: true});
	}, []);

	return [themeState, setThemeState];
}

const ThemeProvider = ({children}) => {
	const [themeState, setThemeState] = useEffectDarkMode();

	if(!themeState.hasThemeMounted){
		return <div />
	}

	const toggle = () => {
		const dark = !themeState.dark;
		localStorage.setItem("dark", JSON.stringify(dark));
		setThemeState({...themeState, dark})
	}

	const computedTheme = themeState.dark ? theme('dark') : theme('light');

	return (
		<EmotionThemeProvider theme = {computedTheme}>
			<ThemeContext.Provider
				value = {{
					dark: themeState.dark,
					toggle
				}}
			>
			{children}
			</ThemeContext.Provider>
		</EmotionThemeProvider>
	)
}


const ThemeWrapper = styled("div")`
    .selectPage-item {
        color: ${props => props.theme.fontColor};
        background-color: ${props => props.theme.primary2};
    };
    .selectPage {
		background-color: ${props => props.theme.primary};
    };
    .arrow {
    	color: ${props => props.theme.fontColor};
    };
    .backToPage {
    	color: ${props => props.theme.fontColor};
    };
`;

export { ThemeProvider, useTheme, ThemeWrapper }

