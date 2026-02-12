import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Intake from './pages/Intake';
import Bipolar from './pages/Mental/modules/Bipolar';
import Genetics from './pages/Genetics';
import Autism from './pages/Autism/Autism';
import Vitals from './pages/Health/VitalsDashboard';
import Meals from './pages/Health/MealPlanner';
import StimsTracker from './pages/Autism/StimmingTracker';
import MedicationTracker from './pages/Health/MedicationTracker';
import HealthHistory from './pages/Health/HealthHistory';
import MoodTracker from './pages/Mental/modules/MoodTracker';
import TherapyNotes from './pages/Mental/modules/TherapyNotes';
// import LoginForm from './features/authentication/LoginForm';
import ArvinFloatingWidget from './components/ArvinFloatingWidget';
import Addiction from './pages/Mental/modules/GamblingAddictionTracker';


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/bipolar" element={<Bipolar />} />
          <Route path="/genetics" element={<Genetics />} />
          <Route path="/autism" element={<Autism />} />
          <Route path='/vitals' element={<Vitals />} />
          <Route path='/meals' element={<Meals />} />
          <Route path='/stimtracker' element={<StimsTracker />} />
          <Route path='/medications' element={<MedicationTracker />} />
          <Route path='/health-history' element={<HealthHistory />} />
          <Route path='/mood-tracker' element={<MoodTracker />} />
          <Route path='/therapy-notes' element={<TherapyNotes />} />
          {/* <Route path='/login' element={<LoginForm />} /> */}
          <Route path='/addiction' element={<Addiction />} />
        </Routes>
      </Layout>
      <ArvinFloatingWidget />
    </Router>
  );
}

export default App;