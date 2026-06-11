import type { UserRole } from "@/lib/constants/roles";

export interface UserStory {
  id: string;
  title: string;
  description: string;
  priority?: "Alta" | "Media" | "Baja";
}

export const USER_STORIES_BY_ROLE: Record<
  Extract<UserRole, "recruiter" | "hiring_manager">,
  UserStory[]
> = {
  recruiter: [
    {
      id: "US-T01",
      title: "Recibir alertas automáticas cuando un candidato con perfil crítico aplica",
      description:
        "Reaccionar rápido y acelerar el contacto con talentos excepcionales.",
      priority: "Media",
    },
    {
      id: "US-T02",
      title: "Visualizar paneles con métricas de avance por vacante",
      description: "Evaluar los cuellos de botella en el embudo de selección.",
    },
  ],
  hiring_manager: [
    {
      id: "US-HM01",
      title: "Visualizar un score comparativo detallado entre candidatos",
      description:
        "Tomar decisiones de contratación objetivas y basadas en datos.",
    },
    {
      id: "US-HM02",
      title: "Decidir tras la entrevista: descartar o aprobar entrevista técnica",
      description:
        "Avanzar o descartar candidatos solo después de entrevistarlos.",
    },
    {
      id: "US-HM03",
      title: "Dejar feedback inmediato con calificación y notas",
      description:
        "Registrar la evaluación en la plataforma justo después de la entrevista.",
    },
  ],
};

export function getUserStoriesForRole(
  role: UserRole | string | null | undefined
): UserStory[] {
  if (role === "hiring_manager") return USER_STORIES_BY_ROLE.hiring_manager;
  if (role === "recruiter") return USER_STORIES_BY_ROLE.recruiter;
  return [];
}
