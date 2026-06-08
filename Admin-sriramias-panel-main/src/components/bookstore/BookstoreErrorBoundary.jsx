import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'

export default class BookstoreErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white p-12 text-center shadow-sm">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h2 className="text-lg font-bold">Something went wrong</h2>
          <p className="max-w-md text-sm text-[#686868]">
            The bookstore module encountered an error. Try refreshing the page.
          </p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      )
    }
    return this.props.children
  }
}
