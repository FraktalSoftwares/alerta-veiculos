interface SettingsPageHeaderProps {
  title: string;
}

export function SettingsPageHeader({ title }: SettingsPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold font-heading text-foreground">{title}</h1>
    </div>
  );
}
