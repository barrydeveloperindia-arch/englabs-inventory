
const React = require('react');

const MockComponent = ({ children }) => children || null;
const ScreenMock = () => null;

const StackMock = Object.assign(MockComponent, { Screen: ScreenMock });
const TabsMock = Object.assign(MockComponent, { Screen: ScreenMock });
const DrawerMock = Object.assign(MockComponent, { Screen: ScreenMock });

const mockObj = {
    Stack: StackMock,
    Tabs: TabsMock,
    Drawer: DrawerMock,
    useRouter: () => ({ push: () => { }, replace: () => { }, back: () => { } }),
    usePathname: () => '/',
    useSegments: () => [],
    useLocalSearchParams: () => ({}),
    Slot: () => null,
    Link: ({ children }) => children,

    // Navigation
    ThemeProvider: ({ children }) => children,
    DarkTheme: { dark: true, colors: { primary: 'blue', background: 'black', card: 'black', text: 'white', border: 'gray', notification: 'red' } },
    DefaultTheme: { dark: false, colors: { primary: 'blue', background: 'white', card: 'white', text: 'black', border: 'gray', notification: 'red' } },

    // Other Common Nav/Expo items
    useNavigation: () => ({ navigate: () => { }, setOptions: () => { } }),
    useRoute: () => ({ params: {} }),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    useFocusEffect: (cb) => { React.useEffect(cb, []); },
};

module.exports = {
    ...mockObj,
    default: mockObj
};
