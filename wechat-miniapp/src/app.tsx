import { PropsWithChildren } from 'react';
import { useLaunch } from '@tarojs/taro';
import { AuthProvider } from './context/AuthContext';

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('App launched.');
  });
  return <AuthProvider>{children}</AuthProvider>;
}

export default App;