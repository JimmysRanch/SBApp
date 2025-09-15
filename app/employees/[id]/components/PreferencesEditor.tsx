import Widget from '@/components/Widget'

type Props = { employeeId: string }

export default function PreferencesEditor({ employeeId }: Props) {
  return (
    <Widget title="Preferences" color="progress">
      <p>Preferences editor placeholder for {employeeId}</p>
    </Widget>
  )
}
