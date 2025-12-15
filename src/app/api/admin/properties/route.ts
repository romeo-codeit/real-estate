import { NextRequest, NextResponse } from 'next/server';
import { createProperty, updateProperty, deleteProperty } from '@/services/sanity/properties.sanity';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

// POST /api/admin/properties - Create new property
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await import('@/services/supabase/supabase-admin').then(m => m.supabaseAdmin.auth.getUser(token));
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await import('@/services/supabase/supabase-admin').then(m => m.supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single());

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();

    // Parse form data
    const propertyData = {
      title: formData.get('title') as string,
      price: parseFloat(formData.get('price') as string),
      address: formData.get('address') as string,
      bedrooms: parseInt(formData.get('bedrooms') as string),
      bathrooms: parseInt(formData.get('bathrooms') as string),
      area: parseInt(formData.get('area') as string),
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      featured: formData.get('featured') === 'true',
      amenities: formData.getAll('amenities[]') as string[],
      mainImage: formData.get('mainImage') as File,
      galleryImages: formData.getAll('galleryImages') as File[],
    };

    const newProperty = await createProperty(propertyData);

    return NextResponse.json({ property: newProperty }, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/properties/[id] - Update property
export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();

    // Parse form data
    const propertyData = {
      title: formData.get('title') as string,
      price: parseFloat(formData.get('price') as string),
      address: formData.get('address') as string,
      bedrooms: parseInt(formData.get('bedrooms') as string),
      bathrooms: parseInt(formData.get('bathrooms') as string),
      area: parseInt(formData.get('area') as string),
      type: formData.get('type') as string,
      description: formData.get('description') as string,
      featured: formData.get('featured') === 'true',
      amenities: formData.getAll('amenities[]') as string[],
      mainImage: formData.get('mainImage') as File,
      galleryImages: formData.getAll('galleryImages') as File[],
    };

    const id = formData.get('id') as string;

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const updatedProperty = await updateProperty(id, propertyData);

    return NextResponse.json({ property: updatedProperty });
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/properties/[id] - Delete property
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await deleteProperty(id);

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}