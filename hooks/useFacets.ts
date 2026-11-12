import { useEffect, useState } from 'react';
import { api, PatentFacets } from '../utils/api';

export const useFacets = () => {
  const [facets, setFacets] = useState<PatentFacets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void api.getFacets().then((result) => {
      if (!active) return;
      setFacets(result);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return { facets, loading };
};
