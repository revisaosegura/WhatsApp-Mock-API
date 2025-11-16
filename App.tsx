import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Messages from "./pages/Messages";
import Contacts from "./pages/Contacts";
import Webhooks from "./pages/Webhooks";
import Documentation from "./pages/Documentation";
import Login from "./pages/Login";
import WhatsAppConnect from "./pages/WhatsAppConnect";
import { useCustomAuth } from "./hooks/useCustomAuth";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useCustomAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <Component {...rest} /> : <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => <ProtectedRoute component={Home} />}
      </Route>
      <Route path="/messages">
        {() => <ProtectedRoute component={Messages} />}
      </Route>
      <Route path="/contacts">
        {() => <ProtectedRoute component={Contacts} />}
      </Route>
      <Route path="/webhooks">
        {() => <ProtectedRoute component={Webhooks} />}
      </Route>
      <Route path="/docs">
        {() => <ProtectedRoute component={Documentation} />}
      </Route>
      <Route path="/whatsapp-connect">
        {() => <ProtectedRoute component={WhatsAppConnect} />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
