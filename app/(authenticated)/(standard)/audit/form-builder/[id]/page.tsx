import { notFound } from "next/navigation";
import { getForm } from "../actions";
import { FormBuilderEditor } from "./components/form-builder-editor";

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FormBuilderEditorPage(props: PageProps) {
  const params = await props.params;
  
  try {
    const { form, sections } = await getForm(params.id);

    if (!form) {
      notFound();
    }

    return <FormBuilderEditor form={form} initialSections={sections} />;
  } catch (error) {
    console.error(error);
    notFound();
  }
}
