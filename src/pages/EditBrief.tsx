import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParsedContent {
  title: string;
  meta_description: string;
  h1: string;
  sections: string[];
  word_count: number;
  primary_keyword: string;
  secondary_keywords: string[];
}

export default function EditBrief() {
  const { briefId } = useParams<{ briefId: string }>();
  const [data, setData] = useState<ParsedContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!briefId) return;

    const load = async () => {
      const { data, error } = await supabase
        .from('content_briefs')
        .select('content')
        .eq('id', briefId)
        .single();

      if (error) {
        toast.error('Failed to load brief');
        return;
      }

      try {
        setData(JSON.parse(data.content));
      } catch {
        toast.error('Invalid JSON content');
      }
    };

    load();
  }, [briefId]);

  const update = <K extends keyof ParsedContent>(
    key: K,
    value: ParsedContent[K]
  ) => {
    if (!data) return;
    setData({ ...data, [key]: value });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);

    const { error } = await supabase
      .from('content_briefs')
      .update({ content: JSON.stringify(data, null, 2) })
      .eq('id', briefId);

    setSaving(false);

    error ? toast.error('Save failed') : toast.success('Saved');
  };

  if (!data) {
    return (
     
        <div style={{ padding: 32, color: '#9CA3AF' }}>Loading…</div>
    
    );
  }

  return (
   <div>
      <div
        className="edit-brief"
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: 24,
          color: '#E5E7EB'
        }}
      >
        {/** CARD */}
        {[
          {
            title: 'Article Metadata',
            body: (
              <>
                <Field label="SEO Title">
                  <input
                    value={data.title}
                    onChange={e => update('title', e.target.value)}
                  />
                </Field>

                <Field label="Meta Description">
                  <textarea
                    rows={3}
                    value={data.meta_description}
                    onChange={e =>
                      update('meta_description', e.target.value)
                    }
                  />
                </Field>

                <Field label="Main Heading (H1)">
                  <input
                    value={data.h1}
                    onChange={e => update('h1', e.target.value)}
                  />
                </Field>
              </>
            )
          },
          {
            title: 'SEO Targets',
            body: (
              <>
                <Field label="Primary Keyword">
                  <input
                    value={data.primary_keyword}
                    onChange={e =>
                      update('primary_keyword', e.target.value)
                    }
                  />
                </Field>

                <Field label="Target Word Count">
                  <input
                    type="number"
                    value={data.word_count}
                    onChange={e =>
                      update('word_count', Number(e.target.value))
                    }
                  />
                </Field>

                <Field label="Secondary Keywords">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.secondary_keywords.map((k, i) => (
                      <input
                        key={i}
                        value={k}
                        onChange={e => {
                          const next = [...data.secondary_keywords];
                          next[i] = e.target.value;
                          update('secondary_keywords', next);
                        }}
                        style={{ width: 200 }}
                      />
                    ))}
                  </div>
                </Field>
              </>
            )
          },
          {
            title: 'Outline Sections',
            body: (
              <>
                {data.sections.map((s, i) => (
                  <input
                    key={i}
                    value={s}
                    onChange={e => {
                      const next = [...data.sections];
                      next[i] = e.target.value;
                      update('sections', next);
                    }}
                    style={{ marginBottom: 8 }}
                  />
                ))}
                <button
                  onClick={() =>
                    update('sections', [...data.sections, 'New section'])
                  }
                >
                  Add section
                </button>
              </>
            )
          }
        ].map((card, i) => (
          <div key={i} className="card">
            <h3>{card.title}</h3>
            {card.body}
          </div>
        ))}

        {/** PREVIEW */}
        <div className="card">
          <h3>Live Preview</h3>

          <h1>{data.title}</h1>
          <p className="muted">{data.meta_description}</p>

          <h2>{data.h1}</h2>

          {data.sections.map((s, i) => (
            <h3 key={i}>{s}</h3>
          ))}

          <div className="badges">
            <span>{data.primary_keyword}</span>
            {data.secondary_keywords.map((k, i) => (
              <span key={i}>{k}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* PAGE-LOCAL STYLES */}
      <style>{`
  .edit-brief {
    background: #F6F8FC;
  }

  /* Cards */
  .edit-brief .card {
    background: #FFFFFF;
    padding: 24px;
    border-radius: 14px;
    margin-bottom: 24px;
    border: 1px solid #E6EAF2;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
  }

  /* Headings */
  .edit-brief h1,
  .edit-brief h2,
  .edit-brief h3 {
    color: #0B1F3B;
    font-weight: 600;
  }

  .edit-brief h3 {
    margin-bottom: 14px;
  }

  /* Inputs */
  .edit-brief input,
  .edit-brief textarea {
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #E6EAF2;
    color: #5B6B8A;
    padding: 12px 14px;
    border-radius: 10px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .edit-brief input::placeholder,
  .edit-brief textarea::placeholder {
    color: #8A94B3;
  }

  .edit-brief input:focus,
  .edit-brief textarea:focus {
    outline: none;
    border-color: #1B64F2;
    box-shadow: 0 0 0 3px rgba(27, 100, 242, 0.12);
  }

  /* Buttons */
  .edit-brief button {
    background: #FFD84D;
    color: #0B1F3B;
    padding: 12px 18px;
    border-radius: 10px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.1s ease;
  }

  .edit-brief button:hover {
    background: #F5C842;
  }

  .edit-brief button:active {
    transform: translateY(1px);
  }

  /* Muted text */
  .edit-brief .muted {
    color: #8A94B3;
  }

  /* Badges / keywords */
  .edit-brief .badges span {
    display: inline-block;
    background: #F6F8FC;
    border: 1px solid #E6EAF2;
    color: #1B64F2;
    padding: 6px 12px;
    border-radius: 999px;
    margin-right: 8px;
    margin-top: 8px;
    font-size: 0.85rem;
    font-weight: 500;
  }
`}</style>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          color: '#9CA3AF',
          fontSize: 13
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
