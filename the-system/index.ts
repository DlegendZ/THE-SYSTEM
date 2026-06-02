import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// Use native screen containers (cheaper transitions). We deliberately do NOT
// call enableFreeze(): freezing tab screens on Android could leave a thawed
// screen blank for a beat. Instead the heavy fx (AmbientEmbers) pause
// themselves when their screen loses focus — see AmbientEmbers.tsx.
enableScreens(true);

import App from './App';

registerRootComponent(App);
