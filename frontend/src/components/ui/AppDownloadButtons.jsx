import AndroidDownloadButton from './AndroidDownloadButton'
import WindowsDownloadButton from './WindowsDownloadButton'

export default function AppDownloadButtons({
  layout = 'stack',
  variant = 'card',
  androidClassName,
  windowsClassName,
}) {
  const isRow = layout === 'row'

  return (
    <div className={`w-full ${isRow ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'flex flex-col gap-3'}`}>
      <AndroidDownloadButton variant={variant} className={androidClassName} />
      <WindowsDownloadButton variant={variant} className={windowsClassName} />
    </div>
  )
}
