import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'

export default class FinanceErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Finance module]', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden />
          <h2 className="text-lg font-bold text-[#111111]">Something went wrong</h2>
          <p className="max-w-md text-sm text-[#686868]">
            The finance section could not be displayed. Try reloading the page. If the problem
            persists, contact support.
          </p>
          <Button type="button" onClick={this.handleReload}>
            Reload Page
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
