import { useEffect } from 'react';
import { initDB } from './database/db';
import StackNavigator from './navigation/StackNavigator';

export default function App() {
    useEffect(() => {
    initDB();
    }, []);

    return <StackNavigator />;
}
