import { useState, useEffect } from "react";
import { Globe, Save, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { countryOptions, languageOptions } from "@/hooks/locate";
import { Combobox } from "@headlessui/react";

export default function ConnectWordPress({ onboardingMode = false, onConnected }) {
  const { currentProject } = useApp();

  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpPassword, setWpPassword] = useState("");
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState("en");
  const [country, setCountry] = useState("US");
  const [langQuery, setLangQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");

  useEffect(() => {
    if (!currentProject) return;

    supabase
      .from("projects")
      .select("*")
      .eq("id", currentProject.id)
      .single()
      .then(({ data }) => {
        if (!data) return;

        setWpUrl(data.wp_url || "");
        setWpUsername(data.wp_username || "");
        setWpPassword(data.wp_app_password || "");
        setConnected(!!(data.wp_url && data.wp_username && data.wp_app_password));
        setLanguage(data.language_code || "en");
        setCountry(data.country_code || "US");
      });
  }, [currentProject]);

  const handleSave = async () => {
    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error("Please fill all fields");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({
        wp_url: wpUrl,
        wp_username: wpUsername,
        wp_app_password: wpPassword,
        language_code: language,
        country_code: country,
      })
      .eq("id", currentProject.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to connect WordPress");
      return;
    }

    setConnected(true);
    toast.success("WordPress connected!");
    onConnected?.();
  };

  const filteredLanguages =
    langQuery === ""
      ? languageOptions
      : languageOptions.filter((l) =>
          l.name.toLowerCase().includes(langQuery.toLowerCase())
        );

  const filteredCountries =
    countryQuery === ""
      ? countryOptions
      : countryOptions.filter((c) =>
          c.name.toLowerCase().includes(countryQuery.toLowerCase())
        );

  return (
    <div className="space-y-6">
      {!onboardingMode && (
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl">
            <Globe className="h-7 w-7 text-[#1B64F2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">WordPress</h2>
            <p className="text-sm text-muted-foreground text-black">
              One-click publishing like Outrank.so
            </p>
          </div>
        </div>
      )}

      {connected ? (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3 text-black">
          <Check className="text-green-500" />
          <span className="font-medium">{wpUrl}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 text-black">
            <Combobox value={language} onChange={setLanguage}>
              <div className="relative">
                <Combobox.Input
                  className="w-full p-3 rounded-xl border"
                  displayValue={(code) =>
                    languageOptions.find((l) => l.code === code)?.name || ""
                  }
                  onChange={(e) => setLangQuery(e.target.value)}
                  placeholder="Language"
                />
                <Combobox.Options className="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow text-black">
                  {filteredLanguages.map((lang) => (
                    <Combobox.Option
                      key={lang.code}
                      value={lang.code}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {lang.name}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </div>
            </Combobox>

            <Combobox value={country} onChange={setCountry}>
              <div className="relative">
                <Combobox.Input
                  className="w-full p-3 rounded-xl border"
                  displayValue={(code) =>
                    countryOptions.find((c) => c.code === code)?.name || ""
                  }
                  onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder="Country"
                />
                <Combobox.Options className="absolute z-10 mt-2 w-full bg-white border rounded-xl shadow">
                  {filteredCountries.map((c) => (
                    <Combobox.Option
                      key={c.code}
                      value={c.code}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {c.name}
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </div>
            </Combobox>
          </div>

          <Input placeholder="https://yoursite.com" className="text-white bg-white" value={wpUrl} onChange={(e) => setWpUrl(e.target.value)} />
          <Input placeholder="Username" className="text-white bg-white" value={wpUsername} onChange={(e) => setWpUsername(e.target.value)} />
          <Input type="password" placeholder="App Password" className="text-white bg-white" value={wpPassword} onChange={(e) => setWpPassword(e.target.value)} />

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-bold"
          >
            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Connect WordPress
          </Button>
        </>
      )}
    </div>
  );
}
